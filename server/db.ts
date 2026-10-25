import fs from 'node:fs';
import path from 'node:path';
import type {
  Brand,
  BrandRule,
  ApprovedClaim,
  AuditRecord,
  DashboardMetrics,
  ReviewDecision,
} from '../src/types/index.js';

interface DatabaseSchema {
  brands: Brand[];
  rules: BrandRule[];
  claims: ApprovedClaim[];
  audits: AuditRecord[];
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inkloom-store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialData(): DatabaseSchema {
  const brand: Brand = {
    id: 'brand-lumino-cloud',
    name: 'Lumino Cloud',
    tagline: 'Resilient, high-throughput cloud infrastructure for modern enterprise.',
    industry: 'Enterprise Cloud Infrastructure & DevOps',
    description:
      'Lumino Cloud provides multi-region mesh orchestration, distributed compute, and sovereign enterprise cloud management.',
    voiceSummary:
      'Authoritative yet approachable, precision-oriented, empathetic, and strictly factual. Never arrogant, hyperbolic, or dismissive of competitors.',
    logoText: 'LUMINO',
    primaryColor: '#6366f1',
    sampleDataLabel: 'Enterprise Brand Profile',
  };

  const solarisBrand: Brand = {
    id: 'brand-solaris-sunscreen',
    name: 'Solaris Skincare',
    tagline: 'Dermatologist-developed mineral sunscreen and gentle daily sun defense.',
    industry: 'Cosmetics & Dermatological Sun Protection',
    description:
      'Solaris formulates broad-spectrum mineral sunscreens powered by non-nano zinc oxide.',
    voiceSummary:
      'Clinical, reassuring, factual, and strictly compliant with FDA OTC sunscreen standards. Never promise miracle cures or make hyperbolic anti-aging claims.',
    logoText: 'SOLARIS',
    primaryColor: '#f59e0b',
    sampleDataLabel: 'Cosmetic Brand Profile',
  };

  const rules: BrandRule[] = [
    {
      id: 'rule-prohibited-hype',
      brandId: brand.id,
      title: 'Prohibition on Absolute Guarantees and Hyperbole',
      category: 'terminology',
      description:
        'Never state or imply that the system is 100% bug-free, infallible, or unconditionally guaranteed against breaches or failures.',
      prohibitedWording: [
        'unbreakable guarantee',
        'hack-proof',
        'military-grade hack-proof',
        '100% bug-free',
        'foolproof',
        'infinite scalability',
        'flawless',
      ],
      severity: 'critical',
      supportingSource: 'Legal & Risk Mitigation Policy v3.8, Section 4.2',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'rule-respectful-competitors',
      brandId: brand.id,
      title: 'Respectful Competitive Positioning',
      category: 'brand_tone',
      description:
        'Focus strictly on Lumino Cloud capabilities and engineering merits. Never disparage legacy providers or use derogatory terms for competitors.',
      prohibitedWording: [
        'inferior competitors',
        'slow dinosaurs',
        'foolish',
        'worthless',
        'clueless',
        'legacy trash',
      ],
      severity: 'high',
      supportingSource: 'Brand Voice & Executive Communication Guidelines 2026 §3',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-12T00:00:00Z',
      updatedAt: '2026-01-12T00:00:00Z',
    },
    {
      id: 'rule-uptime-representation',
      brandId: brand.id,
      title: 'Accurate SLA & Uptime Representation',
      category: 'factual_claims',
      description:
        'Uptime claims must accurately distinguish between the Enterprise Tier SLA (99.9%) and the Standard Tier availability target (99.5%). 99.999% uptime is strictly unapproved.',
      requiredWording: ['SLA', 'Enterprise tier'],
      prohibitedWording: ['99.999%', 'five nines across all tiers'],
      severity: 'critical',
      supportingSource: 'Service Level Agreement Terms of Service 2026, Schedule B',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'rule-official-product-naming',
      brandId: brand.id,
      title: 'Standard Product Nomenclature: Lumino Cloud Mesh',
      category: 'terminology',
      description:
        'Always use the official product trademark "Lumino Cloud Mesh". Never hyphenate as "Lumino-Mesh" or abbreviate to "LuminoMesh".',
      requiredWording: ['Lumino Cloud Mesh'],
      prohibitedWording: ['LuminoMesh', 'Lumino-Mesh', 'Lumino Network'],
      severity: 'medium',
      supportingSource: 'Trademark & Product Marketing Style Guide 2026',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-18T00:00:00Z',
      updatedAt: '2026-01-18T00:00:00Z',
    },
    {
      id: 'rule-customer-metrics',
      brandId: brand.id,
      title: 'Verified Customer Count Substantiation',
      category: 'compliance',
      description:
        'Enterprise customer counts cited in external collateral must directly cite audited quarterly figures. Never claim unverified customer numbers (e.g. 50,000+ or 45,000 enterprises).',
      severity: 'high',
      supportingSource: 'SEC/Corporate Regulatory Disclosure Policy §8',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-20T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    },
    {
      id: 'rule-active-security-cert',
      brandId: brand.id,
      title: 'Current Information Security Certification Standard',
      category: 'compliance',
      description:
        'Public marketing must cite current ISO/IEC 27001:2025. References to obsolete ISO 27001:2022 standards are expired and non-compliant.',
      prohibitedWording: ['ISO-27001:2022', 'ISO 27001:2022'],
      severity: 'critical',
      supportingSource: 'Information Security Governance & Compliance Officer Memo #2025-09',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-22T00:00:00Z',
      updatedAt: '2026-01-22T00:00:00Z',
    },
    {
      id: 'rule-accessibility-readability',
      brandId: brand.id,
      title: 'Acronym Expansion and Plain Language Accessibility',
      category: 'accessibility',
      description:
        'First mentions of technical acronyms must provide the full expansion for cognitive accessibility. Sentences should maintain clear sentence structure.',
      severity: 'low',
      supportingSource: 'WCAG 2.2 AA Marketing Accessibility Standard',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-25T00:00:00Z',
      updatedAt: '2026-01-25T00:00:00Z',
    },
    {
      id: 'rule-visual-brand-consistency',
      brandId: brand.id,
      title: 'Logo Clearspace & Dark Mode Contrast',
      category: 'visual_identity',
      description:
        'Collateral imagery and badges must maintain a minimum 4.5:1 contrast ratio against background surfaces and include clear descriptive alt text.',
      severity: 'medium',
      supportingSource: 'Brand Identity System Specification v4.0',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-01-28T00:00:00Z',
      updatedAt: '2026-01-28T00:00:00Z',
    },
    {
      id: 'rule-solaris-no-medical-claims',
      brandId: solarisBrand.id,
      title: 'Prohibition on Unapproved Medical Claims',
      category: 'compliance',
      description:
        'Never claim that sunscreen cures skin cancer, reverses DNA damage, or acts as an absolute medical cure.',
      prohibitedWording: ['cures skin cancer', 'miracle cure', 'reverses aging', '100% sunblock'],
      severity: 'critical',
      supportingSource: 'Solaris Regulatory & FDA OTC Sunscreen Monograph Guide §2',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'rule-solaris-brand-naming',
      brandId: solarisBrand.id,
      title: 'Official Brand & Trademark Nomenclature: Solaris Mineral Sunscreen',
      category: 'terminology',
      description:
        'Always use the official registered brand trademark "Solaris Mineral Sunscreen" or "Solaris". Never concatenate as "SolarisSun", hyphenate as "Solaris-Sun", or misspell as "Solary".',
      requiredWording: ['Solaris Mineral Sunscreen', 'Solaris'],
      prohibitedWording: ['SolarisSun', 'Solaris-Sun', 'Solary'],
      severity: 'medium',
      supportingSource: 'Solaris Brand Identity & Trademark Guidelines 2026 §1.2',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'rule-solaris-substantiated-claims',
      brandId: solarisBrand.id,
      title: 'Substantiation of SPF and Water Resistance Claims',
      category: 'factual_claims',
      description:
        'Avoid unsupported claims. All performance claims regarding SPF protection or water resistance must cite registered clinical laboratory test results.',
      prohibitedWording: [],
      requiredWording: ['broad spectrum SPF 50', 'water resistant up to 80 minutes'],
      severity: 'high',
      supportingSource: 'Clinical Photobiology Lab Study #SOL-2025-SPF50',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'rule-solaris-no-hyperbole',
      brandId: solarisBrand.id,
      title: 'Cosmetic Realism & Anti-Hyperbole',
      category: 'brand_tone',
      description:
        'Do not make unscientific promises or claim miraculous overnight transformations. Promote realistic, healthy skin protection.',
      prohibitedWording: ['magic formula', 'miracle protection'],
      severity: 'medium',
      supportingSource: 'Solaris Brand Guidelines 2026: Tone & Cosmetic Standards',
      isActive: true,
      sampleDataLabel: 'Verified Brand Standard',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
  ];

  const claims: ApprovedClaim[] = [
    {
      id: 'claim-uptime-enterprise',
      brandId: brand.id,
      claimText:
        '99.9% uptime SLA is guaranteed exclusively on the Lumino Enterprise Tier with multi-region active redundancy enabled.',
      supportingEvidence:
        'SLA Master Services Agreement v2026.1, Schedule C. Audited by Global Reliability Engineering Q1 2026.',
      productScope: 'Lumino Cloud Enterprise Tier',
      validFrom: '2026-01-01',
      validUntil: '2027-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Claim Record',
      tags: ['SLA', 'uptime', 'enterprise'],
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'claim-uptime-standard',
      brandId: brand.id,
      claimText:
        'Standard tier provides 99.5% target availability without financial service credit SLA guarantees.',
      supportingEvidence: 'Standard Terms of Service §5.2.',
      productScope: 'Lumino Cloud Standard Tier',
      validFrom: '2026-01-01',
      validUntil: '2027-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Claim Record',
      tags: ['availability', 'standard-tier'],
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'claim-soc2-iso27001',
      brandId: brand.id,
      claimText:
        'SOC 2 Type II certified and ISO/IEC 27001:2025 audited across all EMEA and US data center clusters.',
      supportingEvidence:
        'Third-party audit report by Coalfire Systems & Schellman, Certificate Ref #ISO-2025-LUM-8831.',
      productScope: 'All Global Data Centers',
      validFrom: '2025-06-01',
      validUntil: '2027-06-01',
      status: 'approved',
      sampleDataLabel: 'Audited Claim Record',
      tags: ['security', 'compliance', 'iso27001', 'soc2'],
      createdAt: '2025-06-15T00:00:00Z',
      updatedAt: '2025-06-15T00:00:00Z',
    },
    {
      id: 'claim-iso27001-legacy-expired',
      brandId: brand.id,
      claimText:
        'ISO-27001:2022 interim standard certification for legacy North America servers.',
      supportingEvidence: 'Archived BSI Audit Certificate #BSI-2022-NA-09 (Superceded).',
      productScope: 'Legacy NA Servers Only',
      validFrom: '2022-01-01',
      validUntil: '2024-12-31',
      status: 'expired',
      sampleDataLabel: 'Archived Claim Record (Expired)',
      tags: ['expired', 'legacy', 'iso27001'],
      createdAt: '2022-01-15T00:00:00Z',
      updatedAt: '2024-12-31T00:00:00Z',
    },
    {
      id: 'claim-cold-start-latency',
      brandId: brand.id,
      claimText:
        'Lumino Cloud Mesh delivers under 45ms cold-start microVM latency across 12 distributed edge regions.',
      supportingEvidence:
        'Independent benchmark report by CloudSpectator Research, Document #CS-2026-BENCH-44.',
      productScope: 'Lumino Cloud Mesh Edge Compute',
      validFrom: '2026-01-15',
      validUntil: '2026-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Claim Record',
      tags: ['latency', 'performance', 'edge'],
      createdAt: '2026-01-20T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    },
    {
      id: 'claim-verified-enterprise-count',
      brandId: brand.id,
      claimText:
        'Serving 1,420 active verified enterprise clients globally as recorded in audited Q1 2026 disclosures.',
      supportingEvidence:
        'Quarterly Financial & Customer Audit, Deloitte & Touche LLP, Section 3.1.',
      productScope: 'Global Enterprise Customer Base',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Claim Record',
      tags: ['customers', 'metrics'],
      createdAt: '2026-01-25T00:00:00Z',
      updatedAt: '2026-01-25T00:00:00Z',
    },
    {
      id: 'claim-solaris-spf50',
      brandId: solarisBrand.id,
      claimText: 'Broad Spectrum SPF 50 mineral protection powered by 20% non-nano zinc oxide.',
      supportingEvidence:
        'FDA OTC Sunscreen Monograph & AMA Laboratories In-Vivo SPF Protocol #AMA-2025-99.',
      productScope: 'Solaris Daily Mineral Sunscreen SPF 50',
      validFrom: '2025-01-01',
      validUntil: '2027-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Clinical Claim',
      tags: ['spf50', 'mineral', 'fda'],
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'claim-solaris-water-resistant',
      brandId: solarisBrand.id,
      claimText: 'Water resistant for up to 80 minutes of swimming or sweating.',
      supportingEvidence:
        'Colipa Water Resistance Protocol 2025, Clinical Study Ref #WR-80M-2025.',
      productScope: 'Solaris Daily Mineral Sunscreen SPF 50',
      validFrom: '2025-01-01',
      validUntil: '2027-12-31',
      status: 'approved',
      sampleDataLabel: 'Audited Clinical Claim',
      tags: ['water-resistant', 'clinical'],
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
  ];

  const audits: AuditRecord[] = [
    {
      id: 'audit-demo-sample-01',
      brandId: brand.id,
      title: 'Q2 Global Architecture Brief',
      channel: 'website',
      content:
        'Lumino Cloud Mesh delivers resilient edge compute with under 45ms cold-start latency. Backed by our Enterprise tier 99.9% uptime SLA, modern teams can scale without operational friction.',
      versionNumber: 1,
      timestamp: '2026-10-20T14:30:00Z',
      status: 'approved',
      score: 100,
      findings: [],
      reviewDecision: {
        decision: 'approved',
        reviewerName: 'Sarah Chen (VP of Brand Governance)',
        reason: 'Fully compliant with approved nomenclature and verified SLA registry claims.',
        timestamp: '2026-10-20T16:00:00Z',
      },
      auditEngine: {
        model: 'gemini-3.8-flash',
        deterministicChecksCount: 8,
        aiChecksCount: 4,
        executionTimeMs: 412,
        geminiApiUsed: true,
      },
    },
  ];

  return {
    brands: [brand, solarisBrand],
    rules,
    claims,
    audits,
    lastUpdated: new Date().toISOString(),
  };
}

export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.brands || !parsed.rules || !parsed.claims || !parsed.audits) {
      const fallback = getInitialData();
      writeDb(fallback);
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db file, restoring initial data:', err);
    const fallback = getInitialData();
    writeDb(fallback);
    return fallback;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// Brand Accessors
export function getBrands(): Brand[] {
  return readDb().brands;
}

export function getBrand(id: string): Brand | undefined {
  return readDb().brands.find((b) => b.id === id);
}

// Rule Accessors
export function getRules(brandId?: string): BrandRule[] {
  const db = readDb();
  if (brandId) {
    return db.rules.filter((r) => r.brandId === brandId);
  }
  return db.rules;
}

export function getRule(id: string): BrandRule | undefined {
  return readDb().rules.find((r) => r.id === id);
}

export function createRule(rule: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'>): BrandRule {
  const db = readDb();
  const newRule: BrandRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.rules.unshift(newRule);
  writeDb(db);
  return newRule;
}

export function updateRule(id: string, updates: Partial<BrandRule>): BrandRule | null {
  const db = readDb();
  const index = db.rules.findIndex((r) => r.id === id);
  if (index === -1) return null;
  db.rules[index] = {
    ...db.rules[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.rules[index];
}

export function deleteRule(id: string): boolean {
  const db = readDb();
  const initialLen = db.rules.length;
  db.rules = db.rules.filter((r) => r.id !== id);
  if (db.rules.length !== initialLen) {
    writeDb(db);
    return true;
  }
  return false;
}

// Claim Accessors
export function getClaims(brandId?: string): ApprovedClaim[] {
  const db = readDb();
  if (brandId) {
    return db.claims.filter((c) => c.brandId === brandId);
  }
  return db.claims;
}

export function getClaim(id: string): ApprovedClaim | undefined {
  return readDb().claims.find((c) => c.id === id);
}

export function createClaim(claim: Omit<ApprovedClaim, 'id' | 'createdAt' | 'updatedAt'>): ApprovedClaim {
  const db = readDb();
  const newClaim: ApprovedClaim = {
    ...claim,
    id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.claims.unshift(newClaim);
  writeDb(db);
  return newClaim;
}

export function updateClaim(id: string, updates: Partial<ApprovedClaim>): ApprovedClaim | null {
  const db = readDb();
  const index = db.claims.findIndex((c) => c.id === id);
  if (index === -1) return null;
  db.claims[index] = {
    ...db.claims[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.claims[index];
}

export function deleteClaim(id: string): boolean {
  const db = readDb();
  const initialLen = db.claims.length;
  db.claims = db.claims.filter((c) => c.id !== id);
  if (db.claims.length !== initialLen) {
    writeDb(db);
    return true;
  }
  return false;
}

// Audit Accessors
export function getAudits(brandId?: string): AuditRecord[] {
  const db = readDb();
  if (brandId) {
    return db.audits.filter((a) => a.brandId === brandId);
  }
  return db.audits;
}

export function getAudit(id: string): AuditRecord | undefined {
  return readDb().audits.find((a) => a.id === id);
}

export function saveAudit(audit: AuditRecord): AuditRecord {
  const db = readDb();
  // Check if exists
  const existingIdx = db.audits.findIndex((a) => a.id === audit.id);
  if (existingIdx !== -1) {
    db.audits[existingIdx] = audit;
  } else {
    db.audits.unshift(audit);
  }
  writeDb(db);
  return audit;
}

export function updateAuditReview(
  auditId: string,
  decision: ReviewDecision
): AuditRecord | null {
  const db = readDb();
  const audit = db.audits.find((a) => a.id === auditId);
  if (!audit) return null;

  audit.reviewDecision = decision;
  audit.status = decision.decision === 'approved' ? 'approved' : 'needs_changes';
  writeDb(db);
  return audit;
}

// Metrics
export function getMetrics(brandId?: string): DashboardMetrics {
  const db = readDb();
  const audits = brandId ? db.audits.filter((a) => a.brandId === brandId) : db.audits;

  let totalFindings = 0;
  let approvedCount = 0;
  let needsChangesCount = 0;
  let draftCount = 0;
  let readyCount = 0;
  let scoreSum = 0;

  const categoryCounts: Record<string, number> = {
    brand_tone: 0,
    terminology: 0,
    factual_claims: 0,
    visual_identity: 0,
    accessibility: 0,
    compliance: 0,
  };

  const severityCounts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const a of audits) {
    if (a.status === 'approved') approvedCount++;
    else if (a.status === 'needs_changes') needsChangesCount++;
    else if (a.status === 'ready_for_review') readyCount++;
    else draftCount++;

    scoreSum += a.score;
    totalFindings += a.findings.length;

    for (const f of a.findings) {
      if (categoryCounts[f.category] !== undefined) {
        categoryCounts[f.category]++;
      }
      if (severityCounts[f.severity] !== undefined) {
        severityCounts[f.severity]++;
      }
    }
  }

  return {
    totalAudits: audits.length,
    totalFindings,
    approvedAudits: approvedCount,
    needsChangesAudits: needsChangesCount,
    draftAudits: draftCount,
    readyForReviewAudits: readyCount,
    averageComplianceScore: audits.length ? Math.round(scoreSum / audits.length) : 0,
    findingsByCategory: categoryCounts as any,
    findingsBySeverity: severityCounts as any,
  };
}

export function resetDemoData(): DatabaseSchema {
  const fresh = getInitialData();
  writeDb(fresh);
  return fresh;
}
