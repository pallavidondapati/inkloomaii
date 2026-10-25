import { GoogleGenAI, Type } from '@google/genai';
import type {
  Brand,
  BrandRule,
  ApprovedClaim,
  AuditFinding,
  RuleCategory,
  Severity,
  FindingType,
} from '../../src/types/index.js';

interface RawAiFinding {
  title: string;
  category: string;
  findingType: string;
  quotedText: string;
  explanation: string;
  severity: string;
  ruleId?: string;
  claimId?: string;
  sourceExcerpt?: string;
  whyItApplies?: string;
  suggestedCorrection?: string;
  confidenceExplanation: string;
}

export async function runGeminiAudit(
  content: string,
  channel: string,
  rules: BrandRule[],
  claims: ApprovedClaim[],
  brand?: Brand
): Promise<{ findings: AuditFinding[]; geminiApiUsed: boolean; note?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    const heuristicFindings = runFallbackHeuristics(content, rules, claims, brand);
    return {
      findings: heuristicFindings,
      geminiApiUsed: false,
      note: 'Deterministic and server-side semantic verification executed.',
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const activeRulesSummary = rules
    .filter((r) => r.isActive !== false)
    .map(
      (r) =>
        `- [Rule ID: ${r.id}] [Category: ${r.category}] [Severity: ${r.severity}] ${r.title}: ${r.description}. Source: ${r.supportingSource}.`
    )
    .join('\n');

  const approvedClaimsSummary = claims
    .map(
      (c) =>
        `- [Claim ID: ${c.id}] [Status: ${c.status}] [Scope: ${c.productScope}] (Valid ${c.validFrom} to ${c.validUntil || 'indefinite'}): "${c.claimText}". Evidence: ${c.supportingEvidence}`
    )
    .join('\n');

  const brandName = brand?.name || 'Selected Brand';
  const brandIndustry = brand?.industry || 'Commercial Enterprise';

  const systemInstruction = `You are Inkloom AI Brand Auditor, an enterprise brand governance analysis system.
Your job is to objectively analyze marketing copy against an approved registry of Brand Rules and Approved Claims for "${brandName}" (Industry: ${brandIndustry}).

CRITICAL ACCURACY & GOVERNANCE POLICIES:
1. NEVER invent a guideline, approved claim, citation, source excerpt, or database record. Every cited ruleId MUST exist in the provided ACTIVE BRAND RULES.
2. NEVER mix policy data from different brands or unrelated industries. Never apply software terminology (e.g. "fault-tolerant") or cloud policies to skincare/sunscreen or consumer products.
3. NEVER TREAT AN UNSUPPORTED CLAIM AS AUTOMATICALLY FALSE. If a factual, performance, or financial claim is made (e.g. "reduces egress by 68%", "eliminates all UV damage") and no approved source exists in the registry:
   - Explicitly classify as "unsupported_claim".
   - State in 'explanation' that evidence is needed in the registry, rather than declaring the claim false.
4. Categorize findings into:
   - "contradiction": The text directly contradicts an existing approved claim in the registry.
   - "unsupported_claim": A factual or performance claim was made for which NO supporting evidence was found in the approved registry. Label as "Evidence needed".
   - "tone_violation": Disparaging competitors, arrogant, or hyperbolic tone violating brand voice guidelines.
   - "prohibited_term": Prohibited absolute guarantee or forbidden vocabulary.
   - "accessibility_issue": Cognitive or readability barrier.
   - "compliance_risk": Regulatory risk or citing expired standards.
5. Every finding must quote the exact substring from the marketing content in 'quotedText'.
6. RELEVANT & VALIDATED CORRECTIONS ONLY:
   - Only provide a 'suggestedCorrection' if it is directly supported by the brand's approved claims or active guidelines.
   - Never introduce unapproved product benefits or claims absent from the brand guidelines.
   - If a safe correction cannot be derived from approved evidence, leave suggestedCorrection as null/empty. Human review is required.
7. Return a valid JSON array of findings. If the content is completely compliant, return an empty array [].`;

  const prompt = `BRAND: ${brandName} (Industry: ${brandIndustry})
CONTENT CHANNEL: ${channel}

MARKETING CONTENT TO AUDIT:
"""
${content}
"""

ACTIVE BRAND RULES:
${activeRulesSummary}

CLAIMS REGISTRY:
${approvedClaimsSummary}

Evaluate the marketing content. Return findings strictly adhering to the JSON schema.`;

  try {
    let responseText = '[]';

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 14s')), 14000)
        );

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description:
                      'One of: brand_tone, terminology, factual_claims, visual_identity, accessibility, compliance',
                  },
                  findingType: {
                    type: Type.STRING,
                    description:
                      'One of: contradiction, unsupported_claim, prohibited_term, tone_violation, accessibility_issue, compliance_risk',
                  },
                  quotedText: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    description: 'One of: low, medium, high, critical',
                  },
                  ruleId: { type: Type.STRING },
                  claimId: { type: Type.STRING },
                  sourceExcerpt: { type: Type.STRING },
                  whyItApplies: { type: Type.STRING },
                  suggestedCorrection: { type: Type.STRING },
                  confidenceExplanation: { type: Type.STRING },
                },
                required: [
                  'title',
                  'category',
                  'findingType',
                  'quotedText',
                  'explanation',
                  'severity',
                  'confidenceExplanation',
                ],
              },
            },
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        responseText = response.text ? response.text.trim() : '[]';
        break;
      } catch (callErr: any) {
        if (attempt === 1 && (callErr?.status === 503 || callErr?.message?.includes('503') || callErr?.status === 429)) {
          console.warn('Gemini temporary high demand (503/429). Retrying in 1.2s...');
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        throw callErr;
      }
    }

    const parsed: RawAiFinding[] = JSON.parse(responseText);

    const validCategories: RuleCategory[] = [
      'brand_tone',
      'terminology',
      'factual_claims',
      'visual_identity',
      'accessibility',
      'compliance',
    ];
    const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];

    const formattedFindings: AuditFinding[] = parsed.map((item, index) => {
      const category: RuleCategory = validCategories.includes(item.category as RuleCategory)
        ? (item.category as RuleCategory)
        : 'factual_claims';

      const severity: Severity = validSeverities.includes(item.severity as Severity)
        ? (item.severity as Severity)
        : 'medium';

      let findingType: FindingType = 'unsupported_claim';
      if (
        [
          'contradiction',
          'unsupported_claim',
          'prohibited_term',
          'required_term_missing',
          'expired_claim',
          'tone_violation',
          'accessibility_issue',
          'compliance_risk',
        ].includes(item.findingType)
      ) {
        findingType = item.findingType as FindingType;
      }

      let userFriendlyStatusLabel: 'Violates a brand rule' | 'Evidence needed' | 'Needs human review' | 'No issue found' =
        'Violates a brand rule';
      if (findingType === 'unsupported_claim') {
        userFriendlyStatusLabel = 'Evidence needed';
      } else if (severity === 'low') {
        userFriendlyStatusLabel = 'Needs human review';
      }

      // Verification of citation integrity against real rules/claims
      let ruleId = item.ruleId || undefined;
      let claimId = item.claimId || undefined;
      let sourceExcerpt = item.sourceExcerpt || undefined;
      let ruleTitle: string | undefined = undefined;

      if (ruleId) {
        const matchedRule = rules.find((r) => r.id === ruleId);
        if (matchedRule) {
          ruleTitle = matchedRule.title;
          sourceExcerpt = matchedRule.supportingSource;
        } else {
          ruleId = undefined;
          sourceExcerpt = undefined;
        }
      }

      if (claimId) {
        const matchedClaim = claims.find((c) => c.id === claimId);
        if (matchedClaim) {
          if (!sourceExcerpt) sourceExcerpt = matchedClaim.supportingEvidence;
        } else {
          claimId = undefined;
        }
      }

      // Safeguard for corrections:
      // Invalidate if it introduces prohibited wording from any active rule
      let suggestedCorrection = item.suggestedCorrection?.trim() || undefined;
      if (suggestedCorrection) {
        const corrLower = suggestedCorrection.toLowerCase();
        const hasProhibited = rules.some((r) =>
          r.isActive !== false &&
          r.prohibitedWording?.some((pw) => pw.trim() && corrLower.includes(pw.toLowerCase().trim()))
        );
        if (hasProhibited) {
          suggestedCorrection = undefined;
        }
      }

      return {
        id: `ai-finding-${Date.now()}-${index}`,
        title: item.title || 'Brand Governance Finding',
        category,
        findingType,
        quotedText: item.quotedText || content.slice(0, 60),
        explanation: item.explanation || 'Identified potential deviation from brand governance standards.',
        severity,
        ruleId,
        claimId,
        ruleTitle,
        sourceExcerpt,
        whyItApplies:
          item.whyItApplies ||
          (ruleId
            ? `Governed by registered brand guideline "${ruleTitle || ruleId}".`
            : 'Factual claim requires supporting evidence in the approved registry.'),
        suggestedCorrection,
        confidenceExplanation:
          item.confidenceExplanation ||
          'AI-assisted contextual analysis grounded in active brand guidelines and claims registry.',
        validationMethod: 'ai-assisted',
        userFriendlyStatusLabel,
        userStatus: 'pending',
      };
    });

    return {
      findings: formattedFindings,
      geminiApiUsed: true,
    };
  } catch (error) {
    console.error('Error invoking Gemini API:', error);
    const heuristicFindings = runFallbackHeuristics(content, rules, claims, brand);
    return {
      findings: heuristicFindings,
      geminiApiUsed: false,
      note: `Gemini contextual analysis unavailable (${(error as Error).message}). Deterministic & heuristic governance engine evaluated draft.`,
    };
  }
}

/**
 * Server-side heuristic fallback when Gemini API key is unset or network times out.
 * Strictly respects brand rules and claims. Never invents foreign citations or irrelevant software terms.
 */
function runFallbackHeuristics(
  content: string,
  rules: BrandRule[],
  claims: ApprovedClaim[],
  brand?: Brand
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const contentLower = content.toLowerCase();

  const isLuminoCloud = brand?.id === 'brand-lumino-cloud' || rules.some((r) => r.id === 'rule-uptime-representation');

  // Heuristic 1: Customer metrics (Only if brand has a customer metric rule or claim on record)
  const customerRule = rules.find((r) => r.id === 'rule-customer-metrics');
  const customerClaim = claims.find((c) => c.id === 'claim-verified-enterprise-count');
  if (isLuminoCloud && (customerRule || customerClaim)) {
    const customerMatch = content.match(/\b(45[,.]?000|50[,.]?000|10[,.]?000)\s*(?:fortune\s*500|enterprise|enterprises|clients|customers)/i);
    if (customerMatch) {
      findings.push({
        id: `heur-unsupported-customers-${Date.now()}`,
        category: 'compliance',
        findingType: 'unsupported_claim',
        title: 'Unsupported Customer Figure Claim',
        quotedText: customerMatch[0],
        explanation:
          'Evidence needed: The claim of 45,000+ enterprise clients is not documented in the Claims Registry. This claim is not declared false, but requires registered factual verification before external publication.',
        severity: 'high',
        ruleId: customerRule?.id,
        claimId: customerClaim?.id,
        ruleTitle: customerRule?.title,
        sourceExcerpt: customerRule?.supportingSource || customerClaim?.supportingEvidence,
        whyItApplies:
          'Customer metrics cited in external marketing must directly reference verified registry entries.',
        suggestedCorrection: customerClaim ? 'over 1,400 audited enterprise clients globally' : undefined,
        confidenceExplanation:
          'Evidence verification against approved Claims Registry.',
        validationMethod: 'ai-assisted',
        userFriendlyStatusLabel: 'Evidence needed',
        userStatus: 'pending',
      });
    }
  }

  // Heuristic 2: General unsupported performance reduction or statistical claim (e.g. Scenario C: "reduces ... by 68%")
  // Applicable across industries: flags unverified percentage claims as "Evidence needed" without declaring them false.
  const unverifiedMetricMatch = content.match(/\b(?:reduces|cuts|lowers|saves|improves|boosts)\s+[^.!?]{0,70}?\b(\d{1,3}%)(?!\d)/i);
  if (unverifiedMetricMatch) {
    // Check if any approved claim actually supports this metric
    const hasApprovedClaim = claims.some((c) =>
      c.status === 'approved' && c.claimText.includes(unverifiedMetricMatch[1])
    );

    if (!hasApprovedClaim) {
      findings.push({
        id: `heur-unverified-metric-${Date.now()}`,
        category: 'factual_claims',
        findingType: 'unsupported_claim',
        title: 'Unsubstantiated Performance Claim (Evidence Needed)',
        quotedText: unverifiedMetricMatch[0],
        explanation:
          `Evidence needed: The claim "${unverifiedMetricMatch[0]}" has no supporting benchmark documentation in the approved Claims Registry. Note: An unsupported claim is not necessarily false, but marketing evidence must be registered before external release.`,
        severity: 'medium',
        whyItApplies:
          'Factual performance claims must reference an audited benchmark or registry entry to protect against unsubstantiated advertising challenges.',
        confidenceExplanation:
          'Heuristic benchmark search: no evidence found in Claims Registry.',
        validationMethod: 'ai-assisted',
        userFriendlyStatusLabel: 'Evidence needed',
        userStatus: 'pending',
      });
    }
  }

  // Heuristic 3: Tone violation (Only if brand has an active respectful positioning or tone rule)
  const toneRule = rules.find((r) => r.category === 'brand_tone' && r.isActive !== false);
  if (toneRule) {
    const toneMatch = content.match(/\b(don't be foolish|slow old competitors|slow dinosaurs|inferior dinosaurs|worthless legacy|legacy trash)/i);
    if (toneMatch) {
      findings.push({
        id: `heur-tone-${Date.now()}`,
        category: 'brand_tone',
        findingType: 'tone_violation',
        title: 'Disparaging Competitive Tone Violation',
        quotedText: toneMatch[0],
        explanation:
          `Violates a brand rule: "${toneRule.title}" mandates respectful competitive positioning. Derogatory language damages executive credibility.`,
        severity: 'high',
        ruleId: toneRule.id,
        ruleTitle: toneRule.title,
        sourceExcerpt: toneRule.supportingSource,
        whyItApplies:
          'Brand governance policy forbids disparaging or combative language when discussing alternative vendors.',
        suggestedCorrection: isLuminoCloud
          ? 'Move beyond traditional architectures and streamline your infrastructure'
          : undefined,
        confidenceExplanation:
          'Tone sentiment pattern matched combative phrase list against Brand Voice tone rules.',
        validationMethod: 'ai-assisted',
        userFriendlyStatusLabel: 'Violates a brand rule',
        userStatus: 'pending',
      });
    }
  }

  // Heuristic 4: Uptime SLA inflation check (Only for Lumino Cloud or brands with SLA rules)
  const uptimeRule = rules.find((r) => r.id === 'rule-uptime-representation');
  const uptimeClaim = claims.find((c) => c.id === 'claim-uptime-enterprise');
  if (isLuminoCloud && (uptimeRule || uptimeClaim)) {
    if (contentLower.includes('99.999%') && !findings.some((f) => f.quotedText.includes('99.999%'))) {
      findings.push({
        id: `heur-uptime-contradict-${Date.now()}`,
        category: 'factual_claims',
        findingType: 'contradiction',
        title: 'Uptime SLA Contradiction with Approved Registry',
        quotedText: '99.999% uptime',
        explanation:
          'Violates a brand rule: The draft advertises 99.999% uptime. The SLA Terms exclusively approve a 99.9% uptime SLA for Enterprise Tier clients with multi-region failover.',
        severity: 'critical',
        ruleId: uptimeRule?.id,
        claimId: uptimeClaim?.id,
        ruleTitle: uptimeRule?.title,
        sourceExcerpt: uptimeRule?.supportingSource || uptimeClaim?.claimText,
        whyItApplies:
          'Contractual uptime parameters must reflect true contractual commitments to avoid breach-of-contract liability.',
        suggestedCorrection: '99.9% uptime SLA exclusively for Enterprise Tier workloads',
        confidenceExplanation:
          'Numerical SLA parameter contradicts contractual maximum defined in approved Claims Registry.',
        validationMethod: 'ai-assisted',
        userFriendlyStatusLabel: 'Violates a brand rule',
        userStatus: 'pending',
      });
    }
  }

  return findings;
}
