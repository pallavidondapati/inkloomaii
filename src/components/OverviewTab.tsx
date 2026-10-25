import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  FileText,
  BadgeAlert,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { DashboardMetrics, AuditRecord, Brand } from '../types/index.js';

interface OverviewTabProps {
  metrics: DashboardMetrics | null;
  recentAudits: AuditRecord[];
  activeBrand: Brand | null;
  onNavigateToAuditor: () => void;
  onLoadDemo: () => void;
  onOpenAudit: (audit: AuditRecord) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  recentAudits,
  activeBrand,
  onNavigateToAuditor,
  onLoadDemo,
  onOpenAudit,
}) => {
  const score = metrics?.averageComplianceScore ?? 0;

  const categoryNames: Record<string, string> = {
    brand_tone: 'Brand Tone & Voice',
    terminology: 'Terminology & Nomenclature',
    factual_claims: 'Factual Claims & SLAs',
    visual_identity: 'Visual Identity & Contrast',
    accessibility: 'Cognitive Accessibility',
    compliance: 'Legal & Certifications',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Executive Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{activeBrand?.name || 'Enterprise Brand'}</span>
              <span aria-hidden="true">·</span>
              <span>Workspace Governance</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 font-semibold">Active Monitoring</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Brand Governance & Compliance Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Automated pre-publication auditing against approved terminology, contractual SLAs, and verified claims.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onNavigateToAuditor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <span>New Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (Tabular Numerals & Single Elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-medium">Average Compliance</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {score}%
            </span>
            <span
              className={`text-xs font-semibold ${
                score >= 90
                  ? 'text-emerald-700'
                  : score >= 70
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {score >= 90 ? 'Optimal' : score >= 70 ? 'Moderate' : 'Action Required'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Across all audited marketing assets</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-medium">Total Audits Processed</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {metrics?.totalAudits ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Persisted in server database</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-medium">Policy Issues Identified</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {metrics?.totalFindings ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              ({metrics?.findingsBySeverity?.critical ?? 0} critical)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Flagged by hybrid audit engine</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-medium">Publication Sign-Offs</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {metrics?.approvedAudits ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              approved / {metrics?.needsChangesAudits ?? 0} revisions
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Authorized stakeholder reviews</div>
        </div>
      </div>

      {/* Interactive Quick Scenarios (Clean & Professional) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pre-Configured Governance Scenarios</h2>
            <p className="text-xs text-slate-500">
              Load test collateral to observe deterministic token checks and Gemini semantic evaluation in real time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div
            onClick={onLoadDemo}
            className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start justify-between gap-3 group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-700">Flagged Copy</span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-900">
                  Cloud Launch with Unverified Claims
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contains prohibited guarantees (*"unbreakable"*), SLA inflation (*99.999%*), and an expired ISO-27001 certificate.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </div>

          <div
            onClick={onNavigateToAuditor}
            className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start justify-between gap-3 group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-700">Verified Standard</span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-900">
                  Compliant Technical Architecture Brief
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Adheres strictly to approved naming (*Lumino Cloud Mesh*), verified 99.9% Enterprise SLA, and active ISO 27001:2025.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </div>
        </div>
      </div>

      {/* Governance Findings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Findings by Policy Domain</h2>
              <p className="text-xs text-slate-500">Aggregated verification statistics</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {metrics?.totalFindings ?? 0} total issues
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(categoryNames).map(([key, name]) => {
              const count =
                metrics?.findingsByCategory?.[key as keyof typeof metrics.findingsByCategory] ?? 0;
              const maxCount = Math.max(
                1,
                ...(metrics ? Object.values(metrics.findingsByCategory) : [1])
              );
              const pct = Math.round((count / maxCount) * 100);

              return (
                <div key={key} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{name}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {count} {count === 1 ? 'issue' : 'issues'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(count > 0 ? 5 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Severity Breakdown</h2>
              <p className="text-xs text-slate-500">Risk impact on publication</p>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-rose-700">Critical Severity</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {metrics?.findingsBySeverity?.critical ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-amber-700">High Severity</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {metrics?.findingsBySeverity?.high ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Medium Severity</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {metrics?.findingsBySeverity?.medium ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">Low Severity</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {metrics?.findingsBySeverity?.low ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            Critical findings represent contractual SLA contradictions or prohibited guarantees that automatically block publication.
          </div>
        </div>
      </div>

      {/* Recent Audits Compact Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Audit Records</h2>
            <p className="text-xs text-slate-500">Latest content submissions and review statuses</p>
          </div>
          <button
            onClick={() => onNavigateToAuditor()}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Launch Auditor &rarr;
          </button>
        </div>

        {recentAudits.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No audit records found. Click "Test Sample Draft" to run an audit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Compliance</th>
                  <th className="py-2.5 px-3">Findings</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAudits.slice(0, 5).map((audit) => {
                  return (
                    <tr key={audit.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{audit.title}</div>
                        <div className="text-[11px] text-slate-400">
                          v{audit.versionNumber} · {new Date(audit.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-600">{audit.channel}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold tabular-nums ${
                            audit.score >= 90
                              ? 'text-emerald-700'
                              : audit.score >= 70
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {audit.score}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 tabular-nums">
                        {audit.findings.length}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-semibold capitalize ${
                            audit.status === 'approved'
                              ? 'text-emerald-700'
                              : audit.status === 'needs_changes'
                              ? 'text-rose-700'
                              : 'text-indigo-700'
                          }`}
                        >
                          {audit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenAudit(audit)}
                          className="px-2.5 py-1 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
