import type {
  Brand,
  BrandRule,
  ApprovedClaim,
  AuditRecord,
  DashboardMetrics,
  ReviewDecision,
  VisualCheckResult,
} from '../types/index.js';

export async function fetchHealth(): Promise<{
  status: string;
  geminiConfigured: boolean;
  geminiModel: string;
  persistence: string;
  timestamp: string;
}> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchBrands(): Promise<Brand[]> {
  const res = await fetch('/api/brands');
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}

export async function fetchRules(brandId?: string): Promise<BrandRule[]> {
  const url = brandId ? `/api/rules?brandId=${encodeURIComponent(brandId)}` : '/api/rules';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch brand rules');
  return res.json();
}

export async function createRuleApi(rule: Partial<BrandRule>): Promise<BrandRule> {
  const res = await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Failed to create rule');
  return res.json();
}

export async function updateRuleApi(id: string, updates: Partial<BrandRule>): Promise<BrandRule> {
  const res = await fetch(`/api/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update rule');
  return res.json();
}

export async function deleteRuleApi(id: string): Promise<void> {
  const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete rule');
}

export async function fetchClaims(brandId?: string): Promise<ApprovedClaim[]> {
  const url = brandId ? `/api/claims?brandId=${encodeURIComponent(brandId)}` : '/api/claims';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export async function createClaimApi(claim: Partial<ApprovedClaim>): Promise<ApprovedClaim> {
  const res = await fetch('/api/claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claim),
  });
  if (!res.ok) throw new Error('Failed to create claim');
  return res.json();
}

export async function updateClaimApi(id: string, updates: Partial<ApprovedClaim>): Promise<ApprovedClaim> {
  const res = await fetch(`/api/claims/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update claim');
  return res.json();
}

export async function deleteClaimApi(id: string): Promise<void> {
  const res = await fetch(`/api/claims/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete claim');
}

export async function runAuditApi(params: {
  brandId: string;
  title: string;
  channel: string;
  content: string;
}): Promise<AuditRecord> {
  const res = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Audit request failed');
  }
  return res.json();
}

export async function runRecheckApi(params: {
  parentAuditId: string;
  brandId: string;
  title: string;
  channel: string;
  content: string;
}): Promise<AuditRecord> {
  const res = await fetch('/api/audit/recheck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Recheck request failed');
  }
  return res.json();
}

export async function fetchAudits(brandId?: string): Promise<AuditRecord[]> {
  const url = brandId ? `/api/audits?brandId=${encodeURIComponent(brandId)}` : '/api/audits';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audits');
  return res.json();
}

export async function fetchAuditDetail(id: string): Promise<AuditRecord> {
  const res = await fetch(`/api/audits/${id}`);
  if (!res.ok) throw new Error('Failed to fetch audit detail');
  return res.json();
}

export async function submitReviewDecisionApi(
  auditId: string,
  decision: {
    decision: 'approved' | 'needs_changes';
    reviewerName: string;
    reason: string;
  }
): Promise<AuditRecord> {
  const res = await fetch(`/api/audits/${auditId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  });
  if (!res.ok) throw new Error('Failed to submit review decision');
  return res.json();
}

export async function fetchMetrics(brandId?: string): Promise<DashboardMetrics> {
  const url = brandId ? `/api/metrics?brandId=${encodeURIComponent(brandId)}` : '/api/metrics';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function resetDemoApi(): Promise<void> {
  const res = await fetch('/api/reset-demo', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
}

export async function runVisualCheckApi(params: {
  fileName?: string;
  contextText?: string;
  altText?: string;
}): Promise<VisualCheckResult> {
  const res = await fetch('/api/visual-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Visual check failed');
  return res.json();
}
