import React, { useState } from 'react';
import { X, Check, ArrowRight, Copy, CheckCheck, Split, FileText } from 'lucide-react';
import type { AuditFinding } from '../types/index.js';

interface DiffComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  currentText: string;
  findings: AuditFinding[];
}

export const DiffComparisonModal: React.FC<DiffComparisonModalProps> = ({
  isOpen,
  onClose,
  originalText,
  currentText,
  findings,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedRemediated, setCopiedRemediated] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedRemediated(true);
      setTimeout(() => setCopiedRemediated(false), 2000);
    }
  };

  // Highlights substrings in the original that have corrections
  const renderHighlightedOriginal = () => {
    const sortedFindings = [...findings]
      .filter((f) => f.quotedText && originalText.includes(f.quotedText))
      .sort((a, b) => originalText.indexOf(a.quotedText) - originalText.indexOf(b.quotedText));

    if (sortedFindings.length === 0) {
      return <span>{originalText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    for (let i = 0; i < sortedFindings.length; i++) {
      const f = sortedFindings[i];
      const matchIndex = originalText.indexOf(f.quotedText, lastIndex);
      if (matchIndex === -1) continue;

      if (matchIndex > lastIndex) {
        segments.push(
          <span key={`orig-plain-${lastIndex}`}>
            {originalText.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      segments.push(
        <mark
          key={`orig-highlight-${f.id}-${matchIndex}`}
          title={`${f.title} (${f.severity})`}
          className="bg-rose-100 text-rose-900 line-through decoration-rose-500 decoration-2 px-1 py-0.5 rounded font-medium"
        >
          {f.quotedText}
        </mark>
      );

      lastIndex = matchIndex + f.quotedText.length;
    }

    if (lastIndex < originalText.length) {
      segments.push(
        <span key={`orig-tail-${lastIndex}`}>{originalText.substring(lastIndex)}</span>
      );
    }

    return segments;
  };

  // Highlights approved replacements in currentText
  const renderHighlightedRemediated = () => {
    const validReplacements = findings
      .filter((f) => f.suggestedCorrection && currentText.includes(f.suggestedCorrection))
      .sort(
        (a, b) =>
          currentText.indexOf(a.suggestedCorrection!) - currentText.indexOf(b.suggestedCorrection!)
      );

    if (validReplacements.length === 0) {
      return <span>{currentText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    for (let i = 0; i < validReplacements.length; i++) {
      const f = validReplacements[i];
      const replacement = f.suggestedCorrection!;
      const matchIndex = currentText.indexOf(replacement, lastIndex);
      if (matchIndex === -1) continue;

      if (matchIndex > lastIndex) {
        segments.push(
          <span key={`rem-plain-${lastIndex}`}>
            {currentText.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      segments.push(
        <mark
          key={`rem-highlight-${f.id}-${matchIndex}`}
          title={`Approved Replacement for: "${f.quotedText}"`}
          className="bg-emerald-100 text-emerald-950 font-semibold px-1 py-0.5 rounded border border-emerald-300"
        >
          {replacement}
        </mark>
      );

      lastIndex = matchIndex + replacement.length;
    }

    if (lastIndex < currentText.length) {
      segments.push(
        <span key={`rem-tail-${lastIndex}`}>{currentText.substring(lastIndex)}</span>
      );
    }

    return segments;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Split className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compliance Diff & Remediation Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing flagged non-compliant phrases alongside approved enterprise replacements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'unified'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unified View
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-200 border border-rose-300 inline-block" />
              <span className="text-slate-600">Flagged Offending Content (Violations)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300 inline-block" />
              <span className="text-slate-600">Approved Brand Replacement (Compliant)</span>
            </div>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            {findings.length} total findings audited
          </span>
        </div>

        {/* Diff Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Original Draft */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-rose-100 text-xs font-semibold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-rose-600" />
                      Original Draft (Pre-Remediation)
                    </span>
                    <button
                      onClick={() => handleCopy(originalText, true)}
                      className="text-rose-700 hover:text-rose-900 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                    >
                      {copiedOriginal ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="pt-4 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {renderHighlightedOriginal()}
                  </div>
                </div>
              </div>

              {/* Right Column: Governed Draft */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100 text-xs font-semibold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Remediated & Governed Draft
                    </span>
                    <button
                      onClick={() => handleCopy(currentText, false)}
                      className="text-emerald-800 hover:text-emerald-950 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                    >
                      {copiedRemediated ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="pt-4 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {renderHighlightedRemediated()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Unified Mode */
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5 space-y-4 text-xs leading-relaxed">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-800">
                  Unified Remediation View
                </span>
                <button
                  onClick={() => handleCopy(currentText, false)}
                  className="px-2.5 py-1 rounded bg-slate-900 text-white font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Clean Text</span>
                </button>
              </div>
              <div className="font-sans text-slate-800 whitespace-pre-wrap">
                {renderHighlightedRemediated()}
              </div>
            </div>
          )}

          {/* Finding-by-finding remediation audit trail table */}
          <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
              Audit Remediation Registry ({findings.length} findings mapped)
            </div>
            <div className="divide-y divide-slate-100 text-xs max-h-56 overflow-y-auto">
              {findings.map((f, i) => (
                <div key={f.id || i} className="p-3 hover:bg-slate-50/70 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{f.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {f.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-800 font-mono bg-rose-50 px-2 py-0.5 rounded inline-block max-w-md truncate">
                      "{f.quotedText}"
                    </div>
                    {f.suggestedCorrection && (
                      <div className="text-[11px] text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded inline-block max-w-md truncate ml-2">
                        → "{f.suggestedCorrection}"
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {f.ruleId || f.claimId || 'Heuristic Rule'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            All replacements adhere to certified Claims Registry records and brand guidelines.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Diff Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
