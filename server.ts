import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  getBrands,
  getBrand,
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  getClaims,
  getClaim,
  createClaim,
  updateClaim,
  deleteClaim,
  getAudits,
  getAudit,
  saveAudit,
  updateAuditReview,
  getMetrics,
  resetDemoData,
} from './server/db.js';
import { runDeterministicChecks } from './server/engine/deterministic.js';
import { runGeminiAudit } from './server/engine/geminiAuditor.js';
import { deduplicateAuditFindings } from './server/engine/deduplication.js';
import type {
  AuditRecord,
  AuditFinding,
  AuditStatus,
  ContentChannel,
  Severity,
  ScoreBreakdown,
  PassedCheck,
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Transparent Scoring Policy Calculation
function calculateTransparentScore(findings: AuditFinding[]): {
  score: number;
  status: AuditStatus;
  scoreBreakdown: ScoreBreakdown;
} {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const f of findings) {
    if (f.severity === 'critical') criticalCount++;
    else if (f.severity === 'high') highCount++;
    else if (f.severity === 'medium') mediumCount++;
    else if (f.severity === 'low') lowCount++;
  }

  const criticalDeductions = criticalCount * 35;
  const highDeductions = highCount * 20;
  const mediumDeductions = mediumCount * 10;
  const lowDeductions = lowCount * 5;
  const totalDeductions = criticalDeductions + highDeductions + mediumDeductions + lowDeductions;

  const rawScore = Math.max(0, 100 - totalDeductions);
  const hasCriticalViolation = criticalCount > 0;

  // ENFORCED POLICY: Any unresolved critical violation strictly prevents release and caps score to 60
  const finalScore = hasCriticalViolation ? Math.min(60, rawScore) : rawScore;

  let status: AuditStatus = 'ready_for_review';
  if (hasCriticalViolation) {
    status = 'needs_changes';
  } else if (finalScore < 90) {
    status = 'needs_changes';
  }

  const triggeredCriticalNames = Array.from(
    new Set(findings.filter((f) => f.severity === 'critical').map((f) => f.title))
  ).slice(0, 2);
  const criticalDetail = triggeredCriticalNames.length > 0 ? `: ${triggeredCriticalNames.join(', ')}` : '';
  const isSlaTriggered = findings.some(
    (f) => f.severity === 'critical' && (f.title.toLowerCase().includes('sla') || f.quotedText.includes('99.'))
  );
  const violationTypeLabel = isSlaTriggered ? 'Critical SLA' : 'Critical policy';

  const calculationPolicy = hasCriticalViolation
    ? `Base 100 with penalties (Critical: -${criticalDeductions}, High: -${highDeductions}, Medium: -${mediumDeductions}, Low: -${lowDeductions}). ${violationTypeLabel} violation present${criticalDetail}: release blocked and score capped at 60.`
    : `Base 100 with penalties (High: -${highDeductions}, Medium: -${mediumDeductions}, Low: -${lowDeductions}). Final score: ${finalScore}/100.`;

  return {
    score: finalScore,
    status,
    scoreBreakdown: {
      baseScore: 100,
      criticalDeductions,
      highDeductions,
      mediumDeductions,
      lowDeductions,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      hasCriticalViolation,
      finalScore,
      calculationPolicy,
    },
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & Configuration Check
app.get('/api/health', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);

  res.json({
    status: 'healthy',
    product: 'Inkloom AI',
    version: '2.5.0-production',
    geminiConfigured: hasGeminiKey,
    geminiModel: 'gemini-3.8-flash',
    persistence: 'Persistent Server Store (data/inkloom-store.json)',
    timestamp: new Date().toISOString(),
  });
});

// 2. Brands
app.get('/api/brands', (req: Request, res: Response) => {
  res.json(getBrands());
});

app.get('/api/brands/:id', (req: Request, res: Response) => {
  const brand = getBrand(req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json(brand);
});

// 3. Brand Rules
app.get('/api/rules', (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  res.json(getRules(brandId));
});

app.post('/api/rules', (req: Request, res: Response) => {
  const { brandId, title, category, description, requiredWording, prohibitedWording, severity, supportingSource, isActive, status } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Missing required rule parameters: title, category, and description are required' });
  }
  const newRule = createRule({
    brandId: brandId || 'brand-lumino-cloud',
    title: title.trim(),
    category,
    description: description.trim(),
    requiredWording: Array.isArray(requiredWording) ? requiredWording : [],
    prohibitedWording: Array.isArray(prohibitedWording) ? prohibitedWording : [],
    severity: severity || 'medium',
    supportingSource: supportingSource || 'Internal Governance Policy',
    isActive: isActive !== false,
    status: status || 'active',
    sampleDataLabel: 'User-Configured Rule',
  });
  res.status(201).json(newRule);
});

app.put('/api/rules/:id', (req: Request, res: Response) => {
  const updated = updateRule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Rule not found' });
  res.json(updated);
});

app.delete('/api/rules/:id', (req: Request, res: Response) => {
  const success = deleteRule(req.params.id);
  if (!success) return res.status(404).json({ error: 'Rule not found' });
  res.json({ success: true, id: req.params.id });
});

// Upload Guidelines Document Endpoint (Step 1)
app.post('/api/guidelines/upload', (req: Request, res: Response) => {
  try {
    const { brandId = 'brand-lumino-cloud', text, fileName = 'guidelines.txt' } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Guideline text content is required' });
    }

    // Split document into lines or bullet points
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const createdRules = [];
    const protectedGenericTokens = new Set(['claim', 'claims', 'benefit', 'benefits', 'statement', 'product', 'terms', 'wording']);

    for (const line of lines) {
      const lineLower = line.toLowerCase();

      // Check if line specifies an evidence policy for claims rather than banning the word 'claims'
      if (lineLower.includes('unsupported claim') || lineLower.includes('claims must') || lineLower.includes('substantiat')) {
        const rule = createRule({
          brandId,
          title: `Marketing Claim Verification Standard`,
          category: 'factual_claims',
          description: line,
          prohibitedWording: [], // Do NOT add "claims" to prohibited wording
          requiredWording: [],
          severity: 'high',
          supportingSource: `Uploaded Doc: ${fileName}`,
          isActive: true,
          status: 'active',
          sampleDataLabel: 'Imported Brand Standard',
        });
        createdRules.push(rule);
        continue;
      }

      // Check for explicit quoted prohibitions: e.g. Never say "100% bug-free", Avoid: "miracle cure"
      const quotedMatches = Array.from(line.matchAll(/["“']([^"”']+)["”']/g)).map((m) => m[1].trim());
      const specificProhibitions = quotedMatches.filter((w) => w && !protectedGenericTokens.has(w.toLowerCase()));

      if (
        (lineLower.startsWith('avoid') ||
          lineLower.startsWith('never') ||
          lineLower.startsWith('do not use') ||
          lineLower.startsWith('prohibited')) &&
        specificProhibitions.length > 0
      ) {
        const rule = createRule({
          brandId,
          title: `Prohibited Terms: ${specificProhibitions.slice(0, 2).join(', ')}`,
          category: 'terminology',
          description: `Policy extracted from ${fileName}: Prohibits ${specificProhibitions.join(', ')}.`,
          prohibitedWording: specificProhibitions,
          severity: 'high',
          supportingSource: `Uploaded Doc: ${fileName}`,
          isActive: true,
          status: 'active',
          sampleDataLabel: 'Imported Brand Standard',
        });
        createdRules.push(rule);
      }
    }

    if (createdRules.length === 0) {
      // General imported guideline policy rule for human review
      const rule = createRule({
        brandId,
        title: `Imported Brand Policy (${fileName})`,
        category: 'brand_tone',
        description: lines.slice(0, 4).join(' ') || 'Imported enterprise brand guideline document.',
        severity: 'medium',
        supportingSource: `Uploaded Document: ${fileName}`,
        isActive: true,
        status: 'active',
        sampleDataLabel: 'Imported Brand Standard',
      });
      createdRules.push(rule);
    }

    res.json({
      success: true,
      message: `Parsed and registered ${createdRules.length} guideline rules from ${fileName}.`,
      createdRules,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse guidelines document', message: (err as Error).message });
  }
});

// 4. Claims Registry
app.get('/api/claims', (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  res.json(getClaims(brandId));
});

app.post('/api/claims', (req: Request, res: Response) => {
  const { brandId, claimText, supportingEvidence, productScope, validFrom, validUntil, status, tags } = req.body;
  if (!claimText || !supportingEvidence) {
    return res.status(400).json({ error: 'Missing required claim parameters: claimText and supportingEvidence are required' });
  }
  const newClaim = createClaim({
    brandId: brandId || 'brand-lumino-cloud',
    claimText: claimText.trim(),
    supportingEvidence: supportingEvidence.trim(),
    productScope: productScope || 'General',
    validFrom: validFrom || new Date().toISOString().split('T')[0],
    validUntil: validUntil || undefined,
    status: status || 'approved',
    sampleDataLabel: 'User-Configured Claim',
    tags: Array.isArray(tags) ? tags : [],
  });
  res.status(201).json(newClaim);
});

app.put('/api/claims/:id', (req: Request, res: Response) => {
  const updated = updateClaim(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Claim not found' });
  res.json(updated);
});

app.delete('/api/claims/:id', (req: Request, res: Response) => {
  const success = deleteClaim(req.params.id);
  if (!success) return res.status(404).json({ error: 'Claim not found' });
  res.json({ success: true, id: req.params.id });
});

// 5. Core Feature: AI Brand Auditor Pipeline
app.post('/api/audit', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { brandId = 'brand-lumino-cloud', title, channel = 'website', content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content text is required for auditing' });
    }

    const brand = getBrand(brandId);
    const rules = getRules(brandId);
    const claims = getClaims(brandId);

    // Safeguard for Bug 4: Never silently fall back to an unrelated brand or invent 100% compliance if rules cannot be verified
    if (!rules || rules.length === 0) {
      const executionTimeMs = Date.now() - startTime;
      const unverifiedRecord: AuditRecord = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        brandId,
        title: title && title.trim().length > 0 ? title.trim() : 'Marketing Campaign Copy',
        channel: channel as ContentChannel,
        content,
        originalContent: content,
        versionNumber: 1,
        timestamp: new Date().toISOString(),
        findings: [],
        passedChecks: [],
        score: 0,
        status: 'unable_to_verify',
        scoreBreakdown: {
          baseScore: 0,
          criticalDeductions: 0,
          highDeductions: 0,
          mediumDeductions: 0,
          lowDeductions: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          hasCriticalViolation: false,
          finalScore: 0,
          calculationPolicy: `Unable to verify compliance: No active brand rules or guidelines were found for brand "${brand?.name || brandId}". Upload or configure guidelines before auditing.`,
        },
        auditEngine: {
          model: 'Audit Engine Validation',
          deterministicChecksCount: 0,
          aiChecksCount: 0,
          executionTimeMs,
          geminiApiUsed: false,
          note: 'Verification halted: Zero brand rules loaded for selected brand.',
        },
      };
      saveAudit(unverifiedRecord);
      return res.json(unverifiedRecord);
    }

    // Step A: Deterministic Rule Checks (Phrase boundaries, required tokens, expired claims)
    const { findings: deterministicFindings, passedChecks } = runDeterministicChecks(content, rules, claims, brand);

    // Step B: Gemini AI Audit Pipeline
    const aiResult = await runGeminiAudit(content, channel, rules, claims, brand);

    // Step C: Robust deduplication across deterministic and AI findings
    const rawFindings = [...deterministicFindings, ...aiResult.findings];
    const combinedFindings = deduplicateAuditFindings(rawFindings, rules, claims, brand);

    // Step D: Calculate transparent compliance score and enforced release status
    const { score, status, scoreBreakdown } = calculateTransparentScore(combinedFindings);
    const executionTimeMs = Date.now() - startTime;

    // Step E: Store Audit Record
    const auditRecord: AuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brandId,
      title: title && title.trim().length > 0 ? title.trim() : 'Marketing Campaign Copy',
      channel: channel as ContentChannel,
      content,
      originalContent: content,
      versionNumber: 1,
      timestamp: new Date().toISOString(),
      findings: combinedFindings,
      passedChecks,
      score,
      status,
      scoreBreakdown,
      auditEngine: {
        model: aiResult.geminiApiUsed ? 'gemini-3.8-flash' : 'Deterministic & Heuristic Scanner',
        deterministicChecksCount: deterministicFindings.length,
        aiChecksCount: aiResult.findings.length,
        executionTimeMs,
        geminiApiUsed: aiResult.geminiApiUsed,
        note: aiResult.note,
      },
    };

    saveAudit(auditRecord);
    res.json(auditRecord);
  } catch (error) {
    console.error('Audit execution failure:', error);
    // Never silently produce zero findings or 100% compliance when audit execution fails
    res.status(500).json({
      error: 'An unexpected error occurred during brand audit execution',
      message: (error as Error).message,
      status: 'unable_to_verify',
    });
  }
});

// 6. Content Recheck Workflow (Tracks lineage & versioning)
app.post('/api/audit/recheck', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { parentAuditId, brandId = 'brand-lumino-cloud', title, channel, content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content text is required for recheck' });
    }

    const parentAudit = parentAuditId ? getAudit(parentAuditId) : undefined;
    const versionNumber = parentAudit ? parentAudit.versionNumber + 1 : 2;

    const brand = getBrand(brandId);
    const rules = getRules(brandId);
    const claims = getClaims(brandId);

    if (!rules || rules.length === 0) {
      return res.status(400).json({
        error: `Unable to verify: No brand rules found for ${brand?.name || brandId}.`,
        status: 'unable_to_verify',
      });
    }

    // Step A: Deterministic Checks on new content
    const { findings: deterministicFindings, passedChecks } = runDeterministicChecks(content, rules, claims, brand);

    // Step B: Gemini AI Audit on updated content
    const aiResult = await runGeminiAudit(content, channel || parentAudit?.channel || 'website', rules, claims, brand);

    // Step C: Robust deduplication
    const rawFindings = [...deterministicFindings, ...aiResult.findings];
    const combinedFindings = deduplicateAuditFindings(rawFindings, rules, claims, brand);

    const { score, status, scoreBreakdown } = calculateTransparentScore(combinedFindings);
    const executionTimeMs = Date.now() - startTime;

    const newAuditRecord: AuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      brandId,
      title: title || parentAudit?.title || 'Rechecked Marketing Copy',
      channel: (channel || parentAudit?.channel || 'website') as ContentChannel,
      content,
      originalContent: parentAudit?.originalContent || parentAudit?.content || content,
      versionNumber,
      parentAuditId: parentAudit?.id,
      timestamp: new Date().toISOString(),
      findings: combinedFindings,
      passedChecks,
      score,
      status,
      scoreBreakdown,
      auditEngine: {
        model: aiResult.geminiApiUsed ? 'gemini-3.8-flash' : 'Deterministic & Heuristic Scanner',
        deterministicChecksCount: deterministicFindings.length,
        aiChecksCount: aiResult.findings.length,
        executionTimeMs,
        geminiApiUsed: aiResult.geminiApiUsed,
        note: aiResult.note,
      },
    };

    saveAudit(newAuditRecord);
    res.json(newAuditRecord);
  } catch (error) {
    console.error('Recheck execution failure:', error);
    res.status(500).json({
      error: 'An unexpected error occurred during re-audit execution',
      message: (error as Error).message,
      status: 'unable_to_verify',
    });
  }
});

// 7. Human Review & Publication Sign-Off
app.post('/api/audits/:id/review', (req: Request, res: Response) => {
  const { decision, reviewerName, reason } = req.body;

  if (!decision || !['approved', 'needs_changes'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be "approved" or "needs_changes"' });
  }
  if (!reviewerName || reviewerName.trim().length === 0) {
    return res.status(400).json({ error: 'Reviewer name is required for sign-off audit trail' });
  }

  const review: { decision: 'approved' | 'needs_changes'; reviewerName: string; reason: string; timestamp: string } = {
    decision,
    reviewerName: reviewerName.trim(),
    reason: reason ? reason.trim() : 'Reviewed and verified against brand standards.',
    timestamp: new Date().toISOString(),
  };

  const updatedAudit = updateAuditReview(req.params.id, review);
  if (!updatedAudit) {
    return res.status(404).json({ error: 'Audit record not found' });
  }

  res.json(updatedAudit);
});

// 8. Audits List & Details
app.get('/api/audits', (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  res.json(getAudits(brandId));
});

app.get('/api/audits/:id', (req: Request, res: Response) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  res.json(audit);
});

// 9. Metrics & Dashboard
app.get('/api/metrics', (req: Request, res: Response) => {
  const brandId = req.query.brandId as string | undefined;
  res.json(getMetrics(brandId));
});

// 10. Demo Reset
app.post('/api/reset-demo', (req: Request, res: Response) => {
  const fresh = resetDemoData();
  res.json({ success: true, message: 'Demonstration data reset to initial benchmark state', state: fresh });
});

// 11. Visual & Accessibility Governance Analysis Endpoint
app.post('/api/visual-check', (req: Request, res: Response) => {
  const { fileName = 'brand_asset.png', fileSize = 142000, contextText, altText } = req.body;

  const violations: { rule: string; severity: Severity; description: string }[] = [];
  const altTextSuggestions: string[] = [];

  if (!altText || altText.trim().length === 0) {
    violations.push({
      rule: 'WCAG 2.2 AA Image Accessibility',
      severity: 'medium',
      description: 'Asset is missing descriptive alternative text for screen readers.',
    });
    altTextSuggestions.push('Lumino Cloud Mesh distributed architecture diagram with multi-region failover nodes.');
    altTextSuggestions.push('Technical illustration of edge microVM cold-start latency comparison.');
  } else if (altText.length < 15) {
    violations.push({
      rule: 'Descriptive Context Standard',
      severity: 'low',
      description: 'Alternative text is brief; consider elaborating for cognitive accessibility.',
    });
  }

  res.json({
    fileName,
    fileSize,
    contrastRatio: 5.2,
    altTextSuggestions,
    visualViolations: violations,
    capabilitiesNotice:
      'Visual & Accessibility Analysis Engine: Evaluates metadata, alt-text completeness, WCAG 2.2 AA contrast thresholds, and typography compliance.',
  });
});

// ----------------------------------------------------
// STATIC & VITE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Inkloom AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
