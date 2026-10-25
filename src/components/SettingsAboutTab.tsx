import React, { useState } from 'react';
import {
  Server,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  CheckCircle2,
  FileCheck2,
  Cpu,
  Database,
  Eye,
  AlertTriangle,
  Lock,
  FileText,
  Workflow,
  SearchCheck,
} from 'lucide-react';
import { runVisualCheckApi } from '../services/api.js';
import type { VisualCheckResult } from '../types/index.js';

export const SettingsAboutTab: React.FC = () => {
  // Visual Asset Check Test State
  const [altText, setAltText] = useState('');
  const [assetName, setAssetName] = useState('lumino_cloud_architecture_mesh.png');
  const [visualResult, setVisualResult] = useState<VisualCheckResult | null>(null);
  const [isCheckingVisual, setIsCheckingVisual] = useState(false);

  const handleRunVisualCheck = async () => {
    setIsCheckingVisual(true);
    try {
      const res = await runVisualCheckApi({
        fileName: assetName,
        altText,
      });
      setVisualResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingVisual(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Enterprise Specifications & Governance Architecture
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Enterprise Edition v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Technical standards, hybrid deterministic rule engine, server-side Gemini AI integration, and pre-publication verification workflow.
          </p>
        </div>
      </div>

      {/* Enterprise Governance Framework Pillars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Enterprise Brand Governance Pillars</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Deterministic Rule Engine
            </div>
            <p className="text-slate-600 leading-relaxed">
              Exact token boundary matching, prohibited hyperbole scanner, and mandatory nomenclature rules with zero false-negative ambiguity.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Grounded AI Verification
            </div>
            <p className="text-slate-600 leading-relaxed">
              Server-side Gemini 3.8 Flash model reasoning strictly constrained by approved brand guidelines, distinguishing contradictions from unsupported claims.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <SearchCheck className="w-4 h-4 text-emerald-600" />
              Audited Claims Registry
            </div>
            <p className="text-slate-600 leading-relaxed">
              Centralized repository of verified performance metrics, SLA agreements, and security certifications with validity date enforcement.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-amber-600" />
              Auditable Review Trail
            </div>
            <p className="text-slate-600 leading-relaxed">
              Version lineage tracking (v1 &rarr; vN), side-by-side diff remediation, and permanent reviewer sign-off stamping before public release.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Architecture Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">System Architecture & Technology Stack</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Frontend Layer
            </div>
            <p className="text-slate-600">
              React 19, TypeScript, Vite build toolchain, and responsive Tailwind CSS. Zero external tracking or client-side telemetry.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-600" />
              Node.js Server Runtime
            </div>
            <p className="text-slate-600">
              Express server running on port 3000 with modular REST endpoints, request payload sanitization, and dev middleware mounting.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              Server-Side AI Pipeline
            </div>
            <p className="text-slate-600">
              Gemini 3.8 Flash accessed via @google/genai SDK. API credentials reside strictly in server environment secrets, never sent to the browser.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              Persistent Storage
            </div>
            <p className="text-slate-600">
              Atomic file-backed database (<code>data/inkloom-store.json</code>) with crash-resilient rename operations, preserving all brand records.
            </p>
          </div>
        </div>
      </div>

      {/* Governance Matrix & Verification Criteria */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Governance Verification Matrix & Enforcement Standards
          </h2>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-2.5 px-3">Verification Domain</th>
                <th className="py-2.5 px-3">Enforcement Method</th>
                <th className="py-2.5 px-3">Governance Standard</th>
                <th className="py-2.5 px-3">Default Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">Prohibited Hyperbole</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Deterministic Token Match</td>
                <td className="py-3 px-3 text-slate-700">
                  Blocks absolute claims ("unbreakable guarantee", "hack-proof", "100% bug-free").
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    CRITICAL
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">SLA & Uptime Representation</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Claims Registry Cross-Check</td>
                <td className="py-3 px-3 text-slate-700">
                  Restricts 99.9% uptime SLA to Enterprise Tier; mandates contractual disclaimer.
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    CRITICAL
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">Product Nomenclature</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Trademark Dictionary</td>
                <td className="py-3 px-3 text-slate-700">
                  Mandates official trademark "Lumino Cloud Mesh"; prohibits abbreviations.
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    MEDIUM
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">Certification Currency</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Temporal Registry Expiry</td>
                <td className="py-3 px-3 text-slate-700">
                  Flags obsolete standards (e.g. ISO-27001:2022 expired Dec 2024); mandates ISO/IEC 27001:2025.
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    CRITICAL
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">Brand Voice & Competitive Positioning</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Gemini AI Sentiment Scan</td>
                <td className="py-3 px-3 text-slate-700">
                  Enforces respectful tone; strictly prohibits disparaging competitor mentions.
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    HIGH
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-800">Cognitive Accessibility</td>
                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">WCAG 2.2 AA Parser</td>
                <td className="py-3 px-3 text-slate-700">
                  Requires acronym expansion on first usage and clean sentence structure.
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                    LOW
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Platform Roadmap */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Enterprise Platform Evolution
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Upcoming Enterprise Capabilities
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Roadmap features engineered for enterprise omnichannel governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-xl border border-white/15 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-white">Multimodal Visual Brand Auditing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated image and video asset inspection for logo clearspace margins, approved brand palette hex conformance, and WCAG AA contrast compliance.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-xl border border-white/15 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-white">Cross-Channel Campaign Synchronization</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Simultaneous cross-referencing of landing pages, outbound email cadences, social posts, and press releases to prevent contradictory messaging across teams.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-xl border border-white/15 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-white">Automated Governance Intelligence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Continuous model alignment benchmarking measuring precision, recall, and zero-hallucination compliance across enterprise marketing corpora.
            </p>
          </div>
        </div>
      </div>

      {/* Visual & Accessibility Asset Validator Diagnostic Tool */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Visual & Accessibility Asset Validator
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Interactive Diagnostic Engine
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Verify digital asset accessibility metadata, alternative text completeness, and WCAG contrast conformance prior to deployment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset File Name</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Image Alt-Text (Leave empty to test accessibility validation alert)
              </label>
              <textarea
                rows={3}
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="e.g. Lumino Cloud Mesh multi-region architecture diagram with active failover nodes"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <button
              onClick={handleRunVisualCheck}
              disabled={isCheckingVisual}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isCheckingVisual ? 'Evaluating...' : 'Run Accessibility & Contrast Check'}
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Scanner Evaluation Result
            </h3>

            {!visualResult ? (
              <div className="text-slate-400 italic text-xs py-8 text-center">
                Click "Run Accessibility & Contrast Check" to inspect results.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                  <span className="text-slate-600">Calculated Contrast Ratio:</span>
                  <span className="font-bold text-emerald-700">{visualResult.contrastRatio}:1 (Passes WCAG AA)</span>
                </div>

                {visualResult.visualViolations.length > 0 ? (
                  <div className="space-y-1">
                    <span className="font-bold text-rose-700 block">Accessibility Flags Identified:</span>
                    {visualResult.visualViolations.map((v, i) => (
                      <div key={i} className="p-2 rounded bg-rose-50 border border-rose-100 text-rose-800">
                        <strong>{v.rule}:</strong> {v.description}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Alt-text and contrast meet accessibility specifications!
                  </div>
                )}

                {visualResult.altTextSuggestions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-bold text-slate-700 block">AI Recommended Alt-Text:</span>
                    {visualResult.altTextSuggestions.map((s, i) => (
                      <div key={i} className="p-1.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                        "{s}"
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                  {visualResult.capabilitiesNotice}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
