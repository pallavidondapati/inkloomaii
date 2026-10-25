import React, { useState, useEffect } from 'react';
import {
  History,
  FileCheck2,
  CheckCircle2,
  Search,
  Eye,
  X,
} from 'lucide-react';
import type { AuditRecord } from '../types/index.js';

interface ReviewHistoryTabProps {
  audits: AuditRecord[];
  onOpenAudit: (audit: AuditRecord) => void;
  onSubmitReview: (
    auditId: string,
    decision: 'approved' | 'needs_changes',
    reviewerName: string,
    reason: string
  ) => Promise<void>;
  highlightedAuditId?: string | null;
}

export const ReviewHistoryTab: React.FC<ReviewHistoryTabProps> = ({
  audits,
  onOpenAudit,
  onSubmitReview,
  highlightedAuditId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAuditForReview, setSelectedAuditForReview] = useState<AuditRecord | null>(null);
  const [inspectAuditModal, setInspectAuditModal] = useState<AuditRecord | null>(null);

  // Auto-scroll on highlightedAuditId
  useEffect(() => {
    if (highlightedAuditId) {
      setSelectedStatus('all');
      setTimeout(() => {
        const el = document.getElementById(`audit-row-${highlightedAuditId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedAuditId]);

  // Review Form
  const [reviewerName, setReviewerName] = useState('Sarah Chen (VP of Brand Governance)');
  const [decision, setDecision] = useState<'approved' | 'needs_changes'>('approved');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses = [
    { id: 'all', label: 'All Audits' },
    { id: 'approved', label: 'Approved' },
    { id: 'needs_changes', label: 'Needs Changes' },
    { id: 'ready_for_review', label: 'Ready for Review' },
  ];

  const filteredAudits = audits.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReviewDialog = (audit: AuditRecord) => {
    setSelectedAuditForReview(audit);
    setDecision(audit.score >= 90 ? 'approved' : 'needs_changes');
    setReason(
      audit.score >= 90
        ? 'Content meets all active brand guidelines, SLA claims, and nomenclature standards.'
        : 'Revisions required to resolve critical terminology and unverified claims.'
    );
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditForReview || !reviewerName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitReview(selectedAuditForReview.id, decision, reviewerName, reason);
      setSelectedAuditForReview(null);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Audit Logs & Sign-Off History
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({audits.length} Records)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Immutable audit trail tracking version lineage (v1 &rarr; vN), identified findings, and executive publication sign-offs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStatus(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedStatus === s.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Table */}
      {filteredAudits.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center space-y-2">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No audit records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Audit logs will populate automatically as campaigns are audited in the Auditor workspace.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Title & Version</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Issues</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Review Decision</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudits.map((audit) => {
                  return (
                    <tr
                      key={audit.id}
                      id={`audit-row-${audit.id}`}
                      className={`transition-colors ${
                        highlightedAuditId === audit.id
                          ? 'bg-sky-50/80 font-medium ring-1 ring-sky-300'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{audit.title}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            v{audit.versionNumber}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(audit.timestamp).toLocaleDateString()}
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

                      <td className="py-3 px-3">
                        {audit.reviewDecision ? (
                          <div className="text-[11px] text-slate-700">
                            <span className="font-semibold block text-slate-900">
                              {audit.reviewDecision.reviewerName}
                            </span>
                            <span className="text-slate-400 italic truncate block max-w-xs">
                              "{audit.reviewDecision.reason}"
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectAuditModal(audit)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Inspect Findings"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenReviewDialog(audit)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Sign-Off
                          </button>

                          <button
                            onClick={() => onOpenAudit(audit)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Audit Findings Modal */}
      {inspectAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{inspectAuditModal.title}</h3>
                <div className="text-xs text-slate-400">
                  Version {inspectAuditModal.versionNumber} · Recorded on{' '}
                  {new Date(inspectAuditModal.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setInspectAuditModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                Audited Copy Text:
              </span>
              {inspectAuditModal.content}
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Recorded Findings ({inspectAuditModal.findings.length}):
              </h4>

              {inspectAuditModal.findings.length === 0 ? (
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No violations logged for this audit version.
                </div>
              ) : (
                inspectAuditModal.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{finding.title}</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {finding.severity}
                      </span>
                    </div>
                    <div className="font-mono text-slate-700 bg-rose-50/60 p-1.5 rounded text-[11px] border border-rose-100">
                      "{finding.quotedText}"
                    </div>
                    <p className="text-slate-600 text-[11px]">{finding.explanation}</p>
                    {finding.suggestedCorrection && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-100">
                        <strong>Correction: </strong>
                        {finding.suggestedCorrection}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setInspectAuditModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      {selectedAuditForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Record Review Decision
              </h3>
              <button
                onClick={() => setSelectedAuditForReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Record</label>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                  {selectedAuditForReview.title} (Score: {selectedAuditForReview.score}%)
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2 px-3 rounded-lg font-semibold border transition-all cursor-pointer ${
                      decision === 'approved'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('needs_changes')}
                    className={`py-2 px-3 rounded-lg font-semibold border transition-all cursor-pointer ${
                      decision === 'needs_changes'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Request Revisions
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Sign-Off Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAuditForReview(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Record Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
