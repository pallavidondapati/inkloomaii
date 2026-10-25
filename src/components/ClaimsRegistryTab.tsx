import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import type { ApprovedClaim, ClaimStatus, Brand } from '../types/index.js';

interface ClaimsRegistryTabProps {
  brand: Brand | null;
  claims: ApprovedClaim[];
  onAddClaim: (claim: Partial<ApprovedClaim>) => Promise<void>;
  onUpdateClaim: (id: string, updates: Partial<ApprovedClaim>) => Promise<void>;
  onDeleteClaim: (id: string) => Promise<void>;
  highlightedClaimId?: string | null;
}

export const ClaimsRegistryTab: React.FC<ClaimsRegistryTabProps> = ({
  brand,
  claims,
  onAddClaim,
  onUpdateClaim,
  onDeleteClaim,
  highlightedClaimId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ApprovedClaim | null>(null);

  // Auto-scroll on highlightedClaimId
  useEffect(() => {
    if (highlightedClaimId) {
      setSelectedStatus('all');
      setTimeout(() => {
        const el = document.getElementById(`claim-card-${highlightedClaimId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedClaimId]);

  // Form State
  const [claimText, setClaimText] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [productScope, setProductScope] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState<ClaimStatus>('approved');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses = [
    { id: 'all', label: 'All Claims' },
    { id: 'approved', label: 'Approved' },
    { id: 'expired', label: 'Expired' },
    { id: 'pending', label: 'Pending' },
  ];

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claimText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.supportingEvidence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.productScope.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingClaim(null);
    setClaimText('');
    setSupportingEvidence('');
    setProductScope('Lumino Cloud Infrastructure');
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidUntil('2027-12-31');
    setStatus('approved');
    setTags('');
    setIsModalOpen(true);
  };

  const openEditModal = (claim: ApprovedClaim) => {
    setEditingClaim(claim);
    setClaimText(claim.claimText);
    setSupportingEvidence(claim.supportingEvidence);
    setProductScope(claim.productScope);
    setValidFrom(claim.validFrom);
    setValidUntil(claim.validUntil || '');
    setStatus(claim.status);
    setTags(claim.tags ? claim.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || !supportingEvidence.trim()) return;

    setIsSubmitting(true);
    try {
      const tagArray = tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingClaim) {
        await onUpdateClaim(editingClaim.id, {
          claimText,
          supportingEvidence,
          productScope,
          validFrom,
          validUntil: validUntil || undefined,
          status,
          tags: tagArray,
        });
      } else {
        await onAddClaim({
          brandId: brand?.id || 'brand-lumino-cloud',
          claimText,
          supportingEvidence,
          productScope,
          validFrom,
          validUntil: validUntil || undefined,
          status,
          tags: tagArray,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving claim:', err);
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
              Approved Claims Registry
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({claims.length} Records)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Single source of verified truth for numerical SLAs, benchmark latencies, customer statistics, and compliance certifications.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Claim</span>
        </button>
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
            placeholder="Search claim text or evidence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No matching claims found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new verified factual claim.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClaims.map((claim) => {
            const isApproved = claim.status === 'approved';
            const isExpired = claim.status === 'expired';

            return (
              <div
                key={claim.id}
                id={`claim-card-${claim.id}`}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                  highlightedClaimId === claim.id
                    ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md'
                    : isExpired
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Metadata Header (Zero-Pill Discipline) */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span
                        className={`font-semibold capitalize ${
                          isApproved
                            ? 'text-emerald-700'
                            : isExpired
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {claim.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{claim.productScope}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {claim.validFrom} to {claim.validUntil || 'Indefinite'}
                      </span>
                    </div>
                  </div>

                  {/* Claim Text */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      "{claim.claimText}"
                    </h3>
                  </div>

                  {/* Audited Evidence */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                      Audited Evidence Reference:
                    </span>
                    <p className="text-slate-700 font-medium">{claim.supportingEvidence}</p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>ID: {claim.id}</span>

                  <div className="flex items-center gap-1 font-sans">
                    <button
                      onClick={() => openEditModal(claim)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit claim"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete claim "${claim.claimText.slice(0, 40)}..."?`)) {
                          onDeleteClaim(claim.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete claim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClaim ? 'Edit Approved Claim' : 'Register Approved Claim'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Claim Statement
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. 99.9% uptime SLA is guaranteed exclusively on Enterprise Tier..."
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Audited Supporting Evidence / Sign-off Document
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Third-party audit report by Coalfire Systems, Ref #ISO-2025-LUM"
                  value={supportingEvidence}
                  onChange={(e) => setSupportingEvidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Product / Scope
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Tier Only"
                    value={productScope}
                    onChange={(e) => setProductScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="expired">Expired (Triggers Warning)</option>
                    <option value="pending">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingClaim ? 'Update Claim' : 'Register Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
