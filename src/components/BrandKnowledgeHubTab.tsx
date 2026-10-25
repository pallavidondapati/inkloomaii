import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  X,
  Upload,
  FileText,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { BrandRule, RuleCategory, Severity, RuleStatus, Brand } from '../types/index.js';

interface BrandKnowledgeHubTabProps {
  brand: Brand | null;
  rules: BrandRule[];
  onAddRule: (rule: Partial<BrandRule>) => Promise<void>;
  onUpdateRule: (id: string, updates: Partial<BrandRule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  highlightedRuleId?: string | null;
}

export const BrandKnowledgeHubTab: React.FC<BrandKnowledgeHubTabProps> = ({
  brand,
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  highlightedRuleId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BrandRule | null>(null);

  // Upload modal state
  const [uploadedDocName, setUploadedDocName] = useState('brand-guidelines-2026.txt');
  const [guidelineText, setGuidelineText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If highlightedRuleId is provided, scroll and highlight
  useEffect(() => {
    if (highlightedRuleId) {
      setSelectedCategory('all');
      setSelectedStatus('all');
      setTimeout(() => {
        const target = document.getElementById(`rule-card-${highlightedRuleId}`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedRuleId]);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RuleCategory>('terminology');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [status, setStatus] = useState<RuleStatus>('active');
  const [prohibitedWording, setProhibitedWording] = useState('');
  const [requiredWording, setRequiredWording] = useState('');
  const [supportingSource, setSupportingSource] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'brand_tone', label: 'Brand Tone' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'factual_claims', label: 'Factual Claims' },
    { id: 'visual_identity', label: 'Visual Identity' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'compliance', label: 'Compliance' },
  ];

  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'active', label: 'Active Rules' },
    { id: 'draft', label: 'Drafts' },
    { id: 'expired', label: 'Expired / Inactive' },
  ];

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.prohibitedWording &&
        rule.prohibitedWording.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;

    const ruleStatus = rule.status || (rule.isActive ? 'active' : 'expired');
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && ruleStatus === 'active') ||
      (selectedStatus === 'draft' && ruleStatus === 'draft') ||
      (selectedStatus === 'expired' && (ruleStatus === 'expired' || !rule.isActive));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openCreateModal = (presetType?: 'prohibited' | 'naming' | 'visual') => {
    setEditingRule(null);
    if (presetType === 'prohibited') {
      setTitle('Prohibited Terminology & Exaggerated Claims');
      setCategory('terminology');
      setDescription('Avoid unverified superlatives and absolute statements without evidence.');
      setSeverity('high');
      setProhibitedWording('infallible, 100% risk-free, flawless');
      setRequiredWording('');
      setSupportingSource('Brand Style Guide 2026');
    } else if (presetType === 'naming') {
      setTitle('Product Trademark Standard');
      setCategory('terminology');
      setDescription('Always refer to the official registered trademark name.');
      setSeverity('medium');
      setProhibitedWording('LuminoMesh, Lumino-Mesh');
      setRequiredWording('Lumino Cloud Mesh');
      setSupportingSource('Trademark & Nomenclature Manual');
    } else if (presetType === 'visual') {
      setTitle('Visual Contrast & Accessible Badges');
      setCategory('visual_identity');
      setDescription('Maintain a minimum 4.5:1 luminance contrast ratio across all backgrounds.');
      setSeverity('medium');
      setProhibitedWording('');
      setRequiredWording('');
      setSupportingSource('WCAG 2.2 AA Contrast Standards');
    } else {
      setTitle('');
      setCategory('terminology');
      setDescription('');
      setSeverity('medium');
      setProhibitedWording('');
      setRequiredWording('');
      setSupportingSource('');
    }
    setStatus('active');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: BrandRule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setCategory(rule.category);
    setDescription(rule.description);
    setSeverity(rule.severity);
    setStatus(rule.status || (rule.isActive ? 'active' : 'expired'));
    setProhibitedWording(rule.prohibitedWording ? rule.prohibitedWording.join(', ') : '');
    setRequiredWording(rule.requiredWording ? rule.requiredWording.join(', ') : '');
    setSupportingSource(rule.supportingSource || '');
    setIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const prohibitedArray = prohibitedWording
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const requiredArray = requiredWording
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingRule) {
        await onUpdateRule(editingRule.id, {
          title,
          category,
          description,
          severity,
          prohibitedWording: prohibitedArray,
          requiredWording: requiredArray,
          supportingSource,
          status,
          isActive: status === 'active',
        });
        setSavedNotification(`Updated rule: "${title}"`);
      } else {
        await onAddRule({
          brandId: brand?.id || 'brand-lumino-cloud',
          title,
          category,
          description,
          severity,
          prohibitedWording: prohibitedArray,
          requiredWording: requiredArray,
          supportingSource,
          status,
          isActive: status === 'active',
        });
        setSavedNotification(`Successfully saved new rule: "${title}"`);
      }
      setIsModalOpen(false);
      setTimeout(() => setSavedNotification(null), 4000);
    } catch (err) {
      console.error('Error saving rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setGuidelineText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessUpload = async () => {
    if (!guidelineText.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/guidelines/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand?.id || 'brand-lumino-cloud',
          text: guidelineText,
          fileName: uploadedDocName,
        }),
      });
      const data = await res.json();
      if (data.createdRules && data.createdRules.length > 0) {
        setUploadSuccessMessage(data.message || 'Guidelines successfully saved to brand registry.');
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadSuccessMessage(null);
          setGuidelineText('');
          // Refresh window data if needed
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Step 1 Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <span className="bg-indigo-50 px-2.5 py-0.5 rounded">Step 1 — Set up your brand</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600">Workspace: {brand?.name || 'Lumino Cloud'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Brand Rules & Guidelines Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Define prohibited phrases, trademark naming conventions, tone criteria, and visual rules. Rules saved here govern all marketing audits.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload Guidelines</span>
            </button>

            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand Rule</span>
            </button>
          </div>
        </div>

        {/* Quick Add Presets Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Add Templates:
          </span>
          <button
            onClick={() => openCreateModal('prohibited')}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            + Prohibited Phrase Rule
          </button>
          <button
            onClick={() => openCreateModal('naming')}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            + Product Naming Rule
          </button>
          <button
            onClick={() => openCreateModal('visual')}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            + Visual & Contrast Rule
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {savedNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotification}</span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
            Saved to persistent store
          </span>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brand rules by title, description, or prohibited word..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">No brand rules found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No rules matched your search or filters. Adjust your criteria or click "Add Brand Rule" above to create one.
            </p>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const ruleStatus = rule.status || (rule.isActive ? 'active' : 'expired');
            const isHighlighted = highlightedRuleId === rule.id;

            return (
              <div
                key={rule.id}
                id={`rule-card-${rule.id}`}
                className={`bg-white rounded-xl border p-5 shadow-2xs space-y-3 transition-all ${
                  isHighlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header: Category, Severity, Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 capitalize">
                      {rule.category.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span
                      className={`font-bold uppercase text-[10px] ${
                        rule.severity === 'critical'
                          ? 'text-rose-700'
                          : rule.severity === 'high'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  {/* Status Badge (Active / Draft / Expired) */}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      ruleStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ruleStatus === 'draft'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {ruleStatus}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

                {/* Prohibited Wording Box */}
                {rule.prohibitedWording && rule.prohibitedWording.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-rose-700 block uppercase">
                      Prohibited Phrases:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rule.prohibitedWording.map((phrase, i) => (
                        <span
                          key={i}
                          className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-rose-200 text-rose-900"
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Wording Box */}
                {rule.requiredWording && rule.requiredWording.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                      Mandatory Required Phrasing:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rule.requiredWording.map((phrase, i) => (
                        <span
                          key={i}
                          className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900"
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: Source & Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] truncate max-w-[240px]">
                    Source: {rule.supportingSource}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(rule)}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                      title="Edit rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete rule "${rule.title}"?`)) {
                          onDeleteRule(rule.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Guidelines Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Upload Brand Guidelines Document
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.text"
              className="hidden"
            />

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Upload a guidelines document (.txt or .md) or paste the text directly. Our parser extracts prohibited wording and brand standards into the active rule store.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Name</label>
                <input
                  type="text"
                  value={uploadedDocName}
                  onChange={(e) => setUploadedDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Guideline Text</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 hover:underline font-medium cursor-pointer"
                  >
                    Select File from Disk
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={guidelineText}
                  onChange={(e) => setGuidelineText(e.target.value)}
                  placeholder="Paste brand guidelines here (e.g. 'Never say: foolproof, hack-proof. Always use Lumino Cloud Mesh...')"
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessUpload}
                disabled={isUploading || !guidelineText.trim()}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Registering Rules...' : 'Save to Brand Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRule ? 'Edit Brand Rule' : 'Create New Brand Rule'}
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
                <label className="block font-semibold text-slate-700 mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prohibited Absolute Guarantees"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RuleCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="terminology">Terminology</option>
                    <option value="brand_tone">Brand Tone</option>
                    <option value="factual_claims">Factual Claims</option>
                    <option value="visual_identity">Visual Identity</option>
                    <option value="accessibility">Accessibility</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="low">Low (Advisory)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Strict)</option>
                    <option value="critical">Critical (Blocks Release)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RuleStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="active">Active (Enforced)</option>
                    <option value="draft">Draft (Testing)</option>
                    <option value="expired">Expired / Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supporting Source</label>
                  <input
                    type="text"
                    placeholder="e.g. Legal Policy §4"
                    value={supportingSource}
                    onChange={(e) => setSupportingSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Policy</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this rule exists and how copy should be structured..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prohibited Phrases (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. unbreakable, 100% bug-free, hack-proof"
                  value={prohibitedWording}
                  onChange={(e) => setProhibitedWording(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Required Phrasing (Comma-separated, optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lumino Cloud Mesh, SLA"
                  value={requiredWording}
                  onChange={(e) => setRequiredWording(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Brand Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
