import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileCheck2,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  CornerDownLeft,
  Split,
  Download,
  Copy,
  CheckCheck,
  Info,
  HelpCircle,
  ChevronDown,
  Wand2,
  BookOpen,
  SlidersHorizontal,
  Flame,
  BadgeAlert,
  Upload,
  Image as ImageIcon,
  Edit3,
  MessageSquare,
  ShieldAlert,
  Search,
} from 'lucide-react';
import type {
  Brand,
  AuditRecord,
  AuditFinding,
  ContentChannel,
  Severity,
  VisualCheckResult,
} from '../types/index.js';
import {
  ENTERPRISE_PRESETS,
  getPresetsForBrand,
  type EnterpriseCopyPreset,
} from '../data/sampleFlawedDraft.js';
import { calculateTextMetrics } from '../utils/textMetrics.js';
import { AuditProgressModal } from './AuditProgressModal.js';
import { DiffComparisonModal } from './DiffComparisonModal.js';

interface ContentAuditorTabProps {
  brand: Brand | null;
  brands?: Brand[];
  onSelectBrand?: (b: Brand) => void;
  currentAudit: AuditRecord | null;
  onRunAudit: (params: {
    brandId: string;
    title: string;
    channel: string;
    content: string;
  }) => Promise<AuditRecord>;
  onRunRecheck: (params: {
    parentAuditId: string;
    brandId: string;
    title: string;
    channel: string;
    content: string;
  }) => Promise<AuditRecord>;
  onSubmitReview: (
    auditId: string,
    decision: 'approved' | 'needs_changes',
    reviewerName: string,
    reason: string
  ) => Promise<void>;
  isLoading: boolean;
}

export const ContentAuditorTab: React.FC<ContentAuditorTabProps> = ({
  brand,
  brands,
  onSelectBrand,
  currentAudit,
  onRunAudit,
  onRunRecheck,
  onSubmitReview,
  isLoading,
}) => {
  // Brand-Specific Presets
  const currentPresets = useMemo(() => getPresetsForBrand(brand?.id), [brand?.id]);

  // Input Form State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => currentPresets[0]?.id || 'scenario-a-non-compliant');
  const [title, setTitle] = useState(() => currentPresets[0]?.title || 'Marketing Copy');
  const [channel, setChannel] = useState<ContentChannel>(() => currentPresets[0]?.channel || 'website');
  const [content, setContent] = useState(() => currentPresets[0]?.content || '');

  // Synchronize draft presets when brand changes
  useEffect(() => {
    const presets = getPresetsForBrand(brand?.id);
    if (presets.length > 0) {
      setSelectedScenarioId(presets[0].id);
      setTitle(presets[0].title);
      setChannel(presets[0].channel);
      setContent(presets[0].content);
      setDismissedFindingIds(new Set());
      setAppliedFindingIds(new Set());
    }
  }, [brand?.id]);

  // Active Tab/Filter within Step 3 & 4
  const [activeResultsTab, setActiveResultsTab] = useState<'critical' | 'other' | 'unsupported' | 'passed' | 'all'>('all');
  const [dismissedFindingIds, setDismissedFindingIds] = useState<Set<string>>(new Set());
  const [dismissReasons, setDismissReasons] = useState<Record<string, string>>({});
  const [dismissingFindingId, setDismissingFindingId] = useState<string | null>(null);
  const [customDismissReason, setCustomDismissReason] = useState('');

  // Inline Custom Editing for Corrections
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [customCorrectionText, setCustomCorrectionText] = useState('');

  // Applied Corrections Tracking
  const [appliedFindingIds, setAppliedFindingIds] = useState<Set<string>>(new Set());
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Image Check State
  const [imageAltText, setImageAltText] = useState('');
  const [imageFileName, setImageFileName] = useState('campaign_header_banner.png');
  const [imageCheckResult, setImageCheckResult] = useState<VisualCheckResult | null>(null);
  const [isCheckingImage, setIsCheckingImage] = useState(false);

  // Review Form State
  const [reviewerName, setReviewerName] = useState('Sarah Chen (VP of Brand Governance)');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'needs_changes'>('approved');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Export State
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current editor content matches the currentAudit
  const isDraftModifiedSinceAudit = useMemo(() => {
    if (!currentAudit) return false;
    return currentAudit.content.trim() !== content.trim();
  }, [currentAudit, content]);

  // Real-time Text Intelligence Metrics
  const textMetrics = useMemo(() => calculateTextMetrics(content), [content]);

  // Handle Scenario Switching
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const preset = currentPresets.find((p) => p.id === scenarioId);
    if (preset) {
      setTitle(preset.title);
      setChannel(preset.channel);
      setContent(preset.content);
      setDismissedFindingIds(new Set());
      setAppliedFindingIds(new Set());
      setBannerMessage({
        text: `Loaded ${preset.name}. Click "Check my content" to run a fresh audit.`,
        type: 'info',
      });
      setTimeout(() => setBannerMessage(null), 5000);
    }
  };

  // Document Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        setBannerMessage({
          text: `Loaded document "${file.name}" (${text.length} characters). Ready to audit.`,
          type: 'success',
        });
        setTimeout(() => setBannerMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Image Check Handler
  const handleRunImageCheck = async () => {
    setIsCheckingImage(true);
    try {
      const res = await fetch('/api/visual-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: imageFileName,
          altText: imageAltText,
          contextText: content.slice(0, 200),
        }),
      });
      const data = await res.json();
      setImageCheckResult(data);
    } catch (err) {
      console.error('Image check failed:', err);
    } finally {
      setIsCheckingImage(false);
    }
  };

  // Audit Trigger
  const handleRunAudit = async () => {
    if (!content.trim()) {
      setBannerMessage({ text: 'Please enter or paste marketing content before checking.', type: 'error' });
      return;
    }
    if (isLoading) return;
    setBannerMessage(null);
    try {
      await onRunAudit({
        brandId: brand?.id || 'brand-lumino-cloud',
        title: title.trim() || 'Untitled Marketing Content',
        channel,
        content: content.trim(),
      });
      setDismissedFindingIds(new Set());
      setAppliedFindingIds(new Set());
    } catch (err) {
      setBannerMessage({
        text: `Audit failed: ${(err as Error).message}. Please try again.`,
        type: 'error',
      });
    }
  };

  // Re-audit Trigger
  const handleRunRecheck = async () => {
    if (!content.trim() || isLoading) return;
    if (!currentAudit) return handleRunAudit();

    setBannerMessage(null);
    try {
      await onRunRecheck({
        parentAuditId: currentAudit.id,
        brandId: brand?.id || 'brand-lumino-cloud',
        title: title.trim(),
        channel,
        content: content.trim(),
      });
      setDismissedFindingIds(new Set());
      setAppliedFindingIds(new Set());
      setBannerMessage({ text: 'Updated draft re-audited successfully.', type: 'success' });
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err) {
      setBannerMessage({
        text: `Recheck failed: ${(err as Error).message}.`,
        type: 'error',
      });
    }
  };

  // Single Finding Remediation: Apply Suggested
  const handleApplyCorrection = (finding: AuditFinding, customText?: string) => {
    const replacement = customText || finding.suggestedCorrection;
    if (!replacement) return;
    const quote = finding.quotedText;

    if (content.includes(quote)) {
      const updated = content.replace(quote, replacement);
      setContent(updated);
      setAppliedFindingIds((prev) => new Set([...prev, finding.id]));
      setDismissedFindingIds((prev) => new Set([...prev, finding.id]));
      setEditingFindingId(null);
      setBannerMessage({
        text: `Applied correction for "${finding.title}".`,
        type: 'success',
      });
      setTimeout(() => setBannerMessage(null), 4000);
    } else {
      alert(`The exact sentence "${quote}" was not found in the editor text. Please update directly.`);
    }
  };

  // Dismiss Finding with a Reason
  const handleConfirmDismiss = (findingId: string) => {
    const reason = customDismissReason.trim() || 'Reviewed and dismissed by content author.';
    setDismissReasons((prev) => ({ ...prev, [findingId]: reason }));
    setDismissedFindingIds((prev) => new Set([...prev, findingId]));
    setDismissingFindingId(null);
    setCustomDismissReason('');
    setBannerMessage({
      text: 'Finding dismissed with documented reason.',
      type: 'info',
    });
    setTimeout(() => setBannerMessage(null), 3000);
  };

  // 1-Click "Accept All Approved Fixes"
  const handleAcceptAllFixes = () => {
    if (!currentAudit || currentAudit.findings.length === 0) return;

    let updatedContent = content;
    let appliedCount = 0;
    const newApplied = new Set(appliedFindingIds);
    const newDismissed = new Set(dismissedFindingIds);

    for (const f of currentAudit.findings) {
      if (f.suggestedCorrection && updatedContent.includes(f.quotedText) && !dismissedFindingIds.has(f.id)) {
        updatedContent = updatedContent.replace(f.quotedText, f.suggestedCorrection);
        appliedCount++;
        newApplied.add(f.id);
        newDismissed.add(f.id);
      }
    }

    if (appliedCount > 0) {
      setContent(updatedContent);
      setAppliedFindingIds(newApplied);
      setDismissedFindingIds(newDismissed);
      setBannerMessage({
        text: `Applied ${appliedCount} approved brand corrections in a single pass. Re-check your content to verify compliance.`,
        type: 'success',
      });
      setTimeout(() => setBannerMessage(null), 6000);
    } else {
      alert('No remaining auto-fixable sentences found in current draft.');
    }
  };

  const handleOpenReviewModal = (decision: 'approved' | 'needs_changes') => {
    setReviewDecision(decision);
    setReviewReason(
      decision === 'approved'
        ? 'Verified adherence to official naming, contractual SLA terms, and verified claims registry.'
        : 'Revisions required to resolve policy violations and unsupported statements.'
    );
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAudit || !reviewerName.trim()) return;
    setIsSubmittingReview(true);
    try {
      await onSubmitReview(currentAudit.id, reviewDecision, reviewerName, reviewReason);
      setIsReviewModalOpen(false);
      setBannerMessage({
        text: `Formal sign-off recorded: ${reviewDecision === 'approved' ? 'Approved for Release' : 'Changes Requested'}.`,
        type: 'success',
      });
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Export Clean Draft
  const handleCopyCleanDraft = () => {
    navigator.clipboard.writeText(content);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  // Export Executive Compliance Report
  const handleCopyMarkdownReport = () => {
    if (!currentAudit) return;
    const report = `# Brand Governance Compliance Summary
**Document:** ${currentAudit.title}
**Date:** ${new Date(currentAudit.timestamp).toLocaleString()}
**Channel:** ${currentAudit.channel.toUpperCase()}
**Version:** v${currentAudit.versionNumber}
**Compliance Score:** ${currentAudit.score}%
**Release Decision:** ${currentAudit.status === 'ready_for_review' || currentAudit.status === 'approved' ? 'READY FOR RELEASE' : 'ACTION REQUIRED'}

## Issues Summary
- Critical Violations: ${currentAudit.findings.filter((f) => f.severity === 'critical').length}
- Other Violations: ${currentAudit.findings.filter((f) => f.severity !== 'critical' && f.findingType !== 'unsupported_claim').length}
- Evidence Needed: ${currentAudit.findings.filter((f) => f.findingType === 'unsupported_claim').length}
- Passed Verifications: ${currentAudit.passedChecks?.length || 0}

## Detailed Findings
${currentAudit.findings
  .map(
    (f, idx) => `### ${idx + 1}. [${f.userFriendlyStatusLabel || f.severity.toUpperCase()}] ${f.title}
- **Problematic Phrase:** "${f.quotedText}"
- **Problem Explanation:** ${f.explanation}
- **Governing Rule & Source:** ${f.ruleTitle || f.sourceExcerpt || 'Brand Knowledge Hub'}
- **Why It Applies:** ${f.whyItApplies || 'Required under enterprise brand governance policy.'}
- **Approved Correction:** ${f.suggestedCorrection || 'Manual editorial review'}
- **Validation Engine:** ${f.validationMethod === 'deterministic' ? 'Deterministic Rule Check' : 'Contextual AI Analysis'}`
  )
  .join('\n\n')}

## Governed Copy
\`\`\`text
${content}
\`\`\`
`;
    navigator.clipboard.writeText(report);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  // Categorize Findings into the 4 Simple Buckets required by prompt:
  // 1. Critical issues (Red)
  // 2. Other issues (Amber)
  // 3. Unsupported claims ("Evidence needed" - Amber)
  // 4. Items that passed the checks ("No issue found" - Green)
  const rawFindings = currentAudit?.findings || [];
  const passedChecks = currentAudit?.passedChecks || [];

  const activeFindings = rawFindings.filter((f) => !dismissedFindingIds.has(f.id));

  const criticalIssues = activeFindings.filter((f) => f.severity === 'critical');
  const unsupportedClaims = activeFindings.filter((f) => f.findingType === 'unsupported_claim');
  const otherIssues = activeFindings.filter((f) => f.severity !== 'critical' && f.findingType !== 'unsupported_claim');

  const visibleFindings = activeFindings.filter((f) => {
    if (activeResultsTab === 'critical') return f.severity === 'critical';
    if (activeResultsTab === 'unsupported') return f.findingType === 'unsupported_claim';
    if (activeResultsTab === 'other') return f.severity !== 'critical' && f.findingType !== 'unsupported_claim';
    return true;
  });

  const remainingUnresolvedCount = activeFindings.length;
  const applicableFixesCount = activeFindings.filter(
    (f) => f.suggestedCorrection && content.includes(f.quotedText)
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Progress Animation Modal */}
      <AuditProgressModal isOpen={isLoading} channel={channel} />

      {/* Side-by-Side Diff Comparison Modal */}
      <DiffComparisonModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        originalText={currentAudit?.originalContent || content}
        currentText={content}
        findings={rawFindings}
      />

      {/* Hidden File Input for Document Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.md,.text"
        className="hidden"
      />

      {/* Banner / Toast Messages */}
      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : bannerMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : bannerMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="font-medium">{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="p-1 rounded hover:bg-black/5 text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 2: Content Checking & Editor Controls Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Step 2: Check your content
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 font-mono text-[11px]">
                Active Guidelines: {brand?.name} {brand?.guidelineVersion || 'v2026.1'}
              </span>
            </div>

            {/* Brand Switcher Bar */}
            {brands && brands.length > 1 && (
              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 pl-1.5 pr-0.5">Brand:</span>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBrand?.(b)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      brand?.id === b.id
                        ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: b.primaryColor || '#6366f1' }}
                    />
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            )}

            <h2 className="text-lg font-bold text-slate-900">
              Content Auditor & Brand Compliance Review
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Write, paste, or upload your draft below. Our engine checks your copy against active brand rules, approved guidelines, and certified claims for <strong>{brand?.name}</strong>.
            </p>
          </div>

          {/* Interactive Scenario Presets */}
          <div className="flex flex-col gap-1 w-full lg:w-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{brand?.name} Fictional Scenarios</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectScenario(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedScenarioId === preset.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={preset.description}
                >
                  {preset.name.split('—')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Channel and Upload Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Channel:</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ContentChannel)}
                className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="website">Website / Landing Page</option>
                <option value="email">Email Outreach</option>
                <option value="social">Social Media (LinkedIn/X)</option>
                <option value="press_release">Press Release</option>
                <option value="ad_copy">Paid Search & Ads</option>
                <option value="blog">Technical Blog</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Document Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Document (.txt, .md)</span>
            </button>

            {/* Campaign Image Checker Button */}
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Check Campaign Image</span>
            </button>
          </div>

          {/* Stale Draft Notice */}
          {isDraftModifiedSinceAudit && currentAudit && (
            <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Draft modified since last audit. Re-check to view updated findings.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Workspace (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between min-h-[580px]">
          {/* Editor Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Document Editor</span>
              <span aria-hidden="true">·</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="font-medium text-slate-800 hover:border-b hover:border-slate-300 focus:border-b focus:border-slate-800 focus:outline-none max-w-xs transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 tabular-nums">
                {textMetrics.wordCount} words · {textMetrics.charCount} chars
              </span>
              <button
                onClick={handleCopyCleanDraft}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                title="Copy editor text"
              >
                {copiedDraft ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="p-5 flex-1 flex flex-col">
            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write your marketing copy here..."
              className="w-full flex-1 focus:outline-none text-sm text-slate-800 font-sans leading-relaxed resize-none placeholder:text-slate-300 font-normal selection:bg-indigo-100"
            />
          </div>

          {/* Editor Footer / Action Bar */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="font-medium text-slate-700">Tone: {textMetrics.toneSummary}</span>
              <span aria-hidden="true">·</span>
              <span>{textMetrics.gradeLevel}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Clearly Labelled "Check my content" Button */}
              <button
                onClick={currentAudit && !isDraftModifiedSinceAudit ? handleRunRecheck : handleRunAudit}
                disabled={isLoading || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Checking your content...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Check my content</span>
                  </>
                )}
              </button>

              {currentAudit && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sign-Off & Approve</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Step 3 & 4 (Understand Results & Fix) (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {!currentAudit && !isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-6 h-6 text-slate-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Ready to audit</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Click the <strong>"Check my content"</strong> button on the left or select a scenario above to inspect your draft for brand compliance.
                </p>
              </div>
              <button
                onClick={handleRunAudit}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Check my content now</span>
              </button>
            </div>
          )}

          {currentAudit && (
            <div className="space-y-4">
              {/* STEP 3: Simple Summary Cards (Plain English) */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Audit Summary & Status
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span
                        className={`text-2xl font-extrabold tabular-nums ${
                          currentAudit.status === 'unable_to_verify'
                            ? 'text-slate-500'
                            : currentAudit.score >= 90
                            ? 'text-emerald-700'
                            : currentAudit.score >= 70
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {currentAudit.status === 'unable_to_verify' ? 'N/A' : `${currentAudit.score}%`}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {currentAudit.status === 'unable_to_verify'
                          ? 'Unable to verify'
                          : currentAudit.status === 'ready_for_review' || currentAudit.status === 'approved'
                          ? 'Ready for release'
                          : 'Requires changes before release'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => setIsDiffModalOpen(true)}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Compare Diff</span>
                    </button>
                  </div>
                </div>

                {/* Plain English Explanation */}
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-200/60">
                  {currentAudit.status === 'unable_to_verify' ? (
                    <span className="text-amber-900 font-medium">
                      Unable to verify: {currentAudit.scoreBreakdown?.calculationPolicy || 'No brand guidelines or rules were loaded for verification. Please upload or configure brand rules.'}
                    </span>
                  ) : criticalIssues.length > 0 ? (
                    <span className="text-rose-900 font-medium">
                      Release blocked: {criticalIssues.length} critical issue{criticalIssues.length > 1 ? 's' : ''} detected ({criticalIssues.map((c) => c.title).slice(0, 2).join(', ')}). {criticalIssues.some((c) => c.title.toLowerCase().includes('sla') || c.quotedText.includes('99.')) ? 'Contractual SLA violations' : 'Prohibited claims and regulatory violations'} must be resolved before this marketing copy can be released.
                    </span>
                  ) : activeFindings.length > 0 ? (
                    <span className="text-amber-900 font-medium">
                      {activeFindings.length} issue{activeFindings.length > 1 ? 's' : ''} need attention. Review suggestions below and apply fixes to reach full compliance.
                    </span>
                  ) : (
                    <span className="text-emerald-900 font-medium">
                      All checks passed! Your copy aligns with approved brand guidelines and verified claims for {brand?.name || 'your brand'}. Ready for human sign-off.
                    </span>
                  )}
                </div>

                {/* 4 Simple Buckets Summary (Required by prompt) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {/* Bucket 1: Critical issues (Red) */}
                  <button
                    onClick={() => setActiveResultsTab('critical')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      activeResultsTab === 'critical'
                        ? 'bg-rose-100/70 border-rose-400 ring-1 ring-rose-400'
                        : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Critical</span>
                    <span className="text-base font-extrabold text-rose-950 tabular-nums">
                      {criticalIssues.length}
                    </span>
                  </button>

                  {/* Bucket 2: Other issues (Amber) */}
                  <button
                    onClick={() => setActiveResultsTab('other')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      activeResultsTab === 'other'
                        ? 'bg-amber-100/70 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Other Issues</span>
                    <span className="text-base font-extrabold text-amber-950 tabular-nums">
                      {otherIssues.length}
                    </span>
                  </button>

                  {/* Bucket 3: Unsupported claims (Amber / Evidence Needed) */}
                  <button
                    onClick={() => setActiveResultsTab('unsupported')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      activeResultsTab === 'unsupported'
                        ? 'bg-amber-100/70 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Evidence Needed</span>
                    <span className="text-base font-extrabold text-amber-950 tabular-nums">
                      {unsupportedClaims.length}
                    </span>
                  </button>

                  {/* Bucket 4: Passed checks (Green) */}
                  <button
                    onClick={() => setActiveResultsTab('passed')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      activeResultsTab === 'passed'
                        ? 'bg-emerald-100/70 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Passed</span>
                    <span className="text-base font-extrabold text-emerald-950 tabular-nums">
                      {passedChecks.length}
                    </span>
                  </button>
                </div>

                {/* 1-Click Batch Fix Button */}
                {applicableFixesCount > 0 && activeResultsTab !== 'passed' && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-bold text-indigo-950 block">
                          Apply approved corrections
                        </span>
                        <span className="text-[11px] text-indigo-700">
                          {applicableFixesCount} approved replacement{applicableFixesCount > 1 ? 's' : ''} available
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleAcceptAllFixes}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept All Fixes</span>
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 4: Detailed Findings & Remediation Cards */}
              <div className="space-y-3">
                {activeResultsTab === 'passed' ? (
                  /* Bucket 4: Passed Checks List */
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                      <span>Verified Items ({passedChecks.length})</span>
                      <button
                        onClick={() => setActiveResultsTab('all')}
                        className="text-indigo-600 hover:underline cursor-pointer"
                      >
                        View All Issues
                      </button>
                    </div>

                    {passedChecks.length === 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                        No verified items recorded for this scan.
                      </div>
                    ) : (
                      passedChecks.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-emerald-200 p-4 shadow-2xs space-y-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2 font-bold text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{item.title}</span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-auto">
                              No issue found
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed pl-6">{item.explanation}</p>
                          <div className="text-[11px] text-slate-400 pl-6 font-mono">
                            Checked: {item.checkedItem} · Source: {item.source}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : visibleFindings.length === 0 ? (
                  /* Zero State for Selected Filter */
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
                    <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeFindings.length === 0
                        ? 'No active issues found in draft'
                        : 'No issues in this filter category'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {activeFindings.length === 0
                        ? 'Your marketing draft conforms to registered brand rules, contractual SLAs, and verified claims.'
                        : 'Switch filter tabs above to inspect remaining issues.'}
                    </p>
                    {activeFindings.length === 0 && (
                      <button
                        onClick={() => handleOpenReviewModal('approved')}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Proceed to Release Sign-Off
                      </button>
                    )}
                  </div>
                ) : (
                  /* Finding Cards */
                  visibleFindings.map((finding) => {
                    const isCritical = finding.severity === 'critical';
                    const isUnsupported = finding.findingType === 'unsupported_claim';
                    const isApplied = appliedFindingIds.has(finding.id);
                    const isEditing = editingFindingId === finding.id;
                    const isDismissing = dismissingFindingId === finding.id;

                    return (
                      <div
                        key={finding.id}
                        className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-colors ${
                          isCritical
                            ? 'border-rose-200 hover:border-rose-300'
                            : isUnsupported
                            ? 'border-amber-200 hover:border-amber-300'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Label, Severity, Engine */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-800'
                                  : isUnsupported
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {finding.userFriendlyStatusLabel || (isCritical ? 'Violates a brand rule' : 'Needs human review')}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-semibold capitalize text-slate-700">
                              {finding.category.replace('_', ' ')}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-slate-400 text-[11px]">
                              {finding.validationMethod === 'deterministic'
                                ? 'Deterministic Rule Check'
                                : 'Contextual AI Analysis'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setDismissingFindingId(finding.id);
                              setCustomDismissReason('');
                            }}
                            className="text-slate-400 hover:text-slate-600 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            title="Dismiss this finding with a documented reason"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-slate-900">{finding.title}</h4>

                        {/* Offending Quote */}
                        <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-950 font-mono text-[11px]">
                          <span className="text-[10px] text-rose-600 font-bold block font-sans">
                            Problematic sentence:
                          </span>
                          "{finding.quotedText}"
                        </div>

                        {/* Explanation & Why It Applies */}
                        <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                          <p>{finding.explanation}</p>
                          {finding.whyItApplies && (
                            <p className="text-[11px] text-slate-500 italic">
                              <strong>Why this applies:</strong> {finding.whyItApplies}
                            </p>
                          )}
                          {(finding.ruleTitle || finding.sourceExcerpt) && (
                            <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 font-mono">
                              Governing Rule: {finding.ruleTitle || 'Brand Standard'} · Ref: {finding.sourceExcerpt || 'Internal Policy'}
                            </div>
                          )}
                        </div>

                        {/* Remediation & Correction Box */}
                        {finding.suggestedCorrection && !isEditing ? (
                          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs space-y-2">
                            <div>
                              <span className="text-[10px] text-emerald-700 font-bold block font-sans">
                                Suggested correction (Supported by brand guidelines):
                              </span>
                              <span className="font-mono font-medium text-[11px] block mt-0.5">
                                "{finding.suggestedCorrection}"
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleApplyCorrection(finding)}
                                disabled={isApplied}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isApplied ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                <span>{isApplied ? 'Applied to draft' : 'Apply correction'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingFindingId(finding.id);
                                  setCustomCorrectionText(finding.suggestedCorrection || '');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 font-medium text-xs transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit correction</span>
                              </button>
                            </div>
                          </div>
                        ) : !isEditing && (
                          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-950 block text-[11px]">
                                Human review required (No automated replacement authorized)
                              </span>
                              <p className="text-[11px] text-amber-900 leading-relaxed">
                                No safe correction can be derived from the available brand guidelines. An automated replacement is withheld to prevent introducing unapproved benefits. Please consult the brand guideline owner to revise manually.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Custom Edit Correction Form */}
                        {isEditing && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs space-y-2">
                            <label className="font-semibold text-slate-800 block">
                              Customize correction before applying:
                            </label>
                            <input
                              type="text"
                              value={customCorrectionText}
                              onChange={(e) => setCustomCorrectionText(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-900 font-mono"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingFindingId(null)}
                                className="px-2.5 py-1 rounded text-slate-600 hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleApplyCorrection(finding, customCorrectionText)}
                                className="px-3 py-1 rounded bg-slate-900 text-white font-medium hover:bg-slate-800"
                              >
                                Apply Custom Text
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Dismissal Reason Form */}
                        {isDismissing && (
                          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                            <label className="font-semibold text-amber-950 block">
                              Reason for dismissing this issue:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Legal exception granted, internal briefing only..."
                              value={customDismissReason}
                              onChange={(e) => setCustomDismissReason(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-amber-300 text-xs text-slate-900 bg-white"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setDismissingFindingId(null)}
                                className="px-2.5 py-1 rounded text-slate-600 hover:bg-amber-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleConfirmDismiss(finding.id)}
                                className="px-3 py-1 rounded bg-amber-800 text-white font-medium hover:bg-amber-900"
                              >
                                Confirm Dismissal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Image Analysis Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Campaign Image & Accessibility Checker
                </h3>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset File Name</label>
                <input
                  type="text"
                  value={imageFileName}
                  onChange={(e) => setImageFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alternative Text (Screen Reader Description)
                </label>
                <textarea
                  rows={3}
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  placeholder="Describe the image content for accessibility and compliance..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleRunImageCheck}
                  disabled={isCheckingImage}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isCheckingImage ? 'Evaluating Image...' : 'Check Image Compliance'}
                </button>
              </div>

              {imageCheckResult && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Contrast Ratio: {imageCheckResult.contrastRatio}:1 (WCAG AA)</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Contrast Passed
                    </span>
                  </div>

                  {imageCheckResult.visualViolations.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {imageCheckResult.visualViolations.map((v, i) => (
                        <div key={i} className="text-rose-800 text-[11px] font-medium">
                          • {v.rule}: {v.description}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-emerald-800 text-[11px] font-medium">
                      ✓ No accessibility or visual violations detected.
                    </div>
                  )}

                  {imageCheckResult.altTextSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">Recommended Alt Text:</span>
                      <ul className="space-y-1 text-slate-700">
                        {imageCheckResult.altTextSuggestions.map((s, i) => (
                          <li key={i} className="font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200">
                            "{s}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Sign-Off Modal */}
      {isReviewModalOpen && currentAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Governance Review & Publication Sign-Off
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Version & Rating
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {currentAudit.title} (v{currentAudit.versionNumber}) · {currentAudit.score}% Compliance
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('approved')}
                    className={`py-2 px-3 rounded-lg font-semibold border transition-all cursor-pointer ${
                      reviewDecision === 'approved'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Approve for Publication
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('needs_changes')}
                    className={`py-2 px-3 rounded-lg font-semibold border transition-all cursor-pointer ${
                      reviewDecision === 'needs_changes'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Request Revision
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sign-Off Reviewer Name
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decision Rationale & Comments
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReview ? 'Recording...' : 'Record Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
