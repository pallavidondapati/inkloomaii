export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type RuleCategory =
  | 'brand_tone'
  | 'terminology'
  | 'factual_claims'
  | 'visual_identity'
  | 'accessibility'
  | 'compliance';

export type RuleStatus = 'active' | 'draft' | 'expired';

export type ClaimStatus = 'approved' | 'pending' | 'expired' | 'inactive';

export type AuditStatus = 'draft' | 'needs_changes' | 'ready_for_review' | 'approved' | 'unable_to_verify';

export type ContentChannel =
  | 'website'
  | 'email'
  | 'social'
  | 'press_release'
  | 'ad_copy'
  | 'blog';

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  description: string;
  voiceSummary: string;
  logoText: string;
  primaryColor: string;
  sampleDataLabel: string;
  guidelineVersion?: string;
  updatedAt?: string;
}

export interface BrandRule {
  id: string;
  brandId: string;
  title: string;
  category: RuleCategory;
  description: string;
  requiredWording?: string[];
  prohibitedWording?: string[];
  severity: Severity;
  supportingSource: string;
  isActive: boolean;
  status?: RuleStatus;
  sampleDataLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedClaim {
  id: string;
  brandId: string;
  claimText: string;
  supportingEvidence: string;
  productScope: string;
  validFrom: string;
  validUntil?: string;
  status: ClaimStatus;
  sampleDataLabel: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type FindingType =
  | 'contradiction'
  | 'unsupported_claim'
  | 'prohibited_term'
  | 'required_term_missing'
  | 'expired_claim'
  | 'tone_violation'
  | 'accessibility_issue'
  | 'compliance_risk';

export interface PassedCheck {
  id: string;
  title: string;
  category: RuleCategory;
  explanation: string;
  source: string;
  checkedItem: string;
}

export interface AuditFinding {
  id: string;
  category: RuleCategory;
  title: string;
  quotedText: string;
  explanation: string;
  severity: Severity;
  ruleId?: string;
  claimId?: string;
  ruleTitle?: string;
  sourceExcerpt?: string;
  whyItApplies?: string;
  suggestedCorrection?: string;
  confidenceExplanation: string;
  validationMethod: 'deterministic' | 'ai-assisted';
  findingType: FindingType;
  userFriendlyStatusLabel?: 'Violates a brand rule' | 'Evidence needed' | 'Needs human review' | 'No issue found';
  userStatus?: 'pending' | 'accepted' | 'rejected' | 'edited';
  userCustomText?: string;
  dismissReason?: string;
}

export interface ReviewDecision {
  decision: 'approved' | 'needs_changes';
  reviewerName: string;
  reason: string;
  timestamp: string;
}

export interface ScoreBreakdown {
  baseScore: number;
  criticalDeductions: number;
  highDeductions: number;
  mediumDeductions: number;
  lowDeductions: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  hasCriticalViolation: boolean;
  finalScore: number;
  calculationPolicy: string;
}

export interface AuditRecord {
  id: string;
  brandId: string;
  title: string;
  channel: ContentChannel;
  content: string;
  originalContent?: string;
  versionNumber: number;
  parentAuditId?: string;
  timestamp: string;
  findings: AuditFinding[];
  passedChecks?: PassedCheck[];
  score: number; // 0 to 100
  status: AuditStatus;
  scoreBreakdown?: ScoreBreakdown;
  reviewDecision?: ReviewDecision;
  auditEngine: {
    model: string;
    deterministicChecksCount: number;
    aiChecksCount: number;
    executionTimeMs: number;
    geminiApiUsed: boolean;
    note?: string;
  };
}

export interface DashboardMetrics {
  totalAudits: number;
  totalFindings: number;
  approvedAudits: number;
  needsChangesAudits: number;
  draftAudits: number;
  readyForReviewAudits: number;
  averageComplianceScore: number;
  findingsByCategory: Record<RuleCategory, number>;
  findingsBySeverity: Record<Severity, number>;
}

export interface VisualCheckResult {
  fileName: string;
  fileSize: number;
  contrastRatio?: number;
  detectedText?: string;
  altTextSuggestions: string[];
  visualViolations: {
    rule: string;
    severity: Severity;
    description: string;
  }[];
  capabilitiesNotice: string;
}
