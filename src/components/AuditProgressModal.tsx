import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface AuditProgressModalProps {
  isOpen: boolean;
  channel: string;
  onComplete?: () => void;
}

interface AuditStage {
  id: string;
  name: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  durationMs: number;
}

const AUDIT_STAGES: AuditStage[] = [
  {
    id: 'lexical',
    name: '1. Deterministic Token & Prohibited Terms Scan',
    shortDesc: 'Scanning 84 prohibited phrases, trademark naming patterns, and unverified absolute claims',
    icon: ShieldCheck,
    durationMs: 450,
  },
  {
    id: 'registry',
    name: '2. Factual Claims & SLA Registry Cross-Reference',
    shortDesc: 'Verifying quantitative metrics against active SOC-2, ISO-27001, and 99.9% Enterprise Tier SLA contracts',
    icon: Database,
    durationMs: 650,
  },
  {
    id: 'gemini',
    name: '3. Gemini 3.8 Flash Contextual & Tone Governance',
    shortDesc: 'Analyzing competitive positioning, tone sentiment, and enterprise brand voice alignment',
    icon: Sparkles,
    durationMs: 850,
  },
  {
    id: 'synthesis',
    name: '4. Remediation Synthesis & Diff Patch Compilation',
    shortDesc: 'Generating precise approved replacement strings and computing compliance index',
    icon: Layers,
    durationMs: 400,
  },
];

export const AuditProgressModal: React.FC<AuditProgressModalProps> = ({ isOpen, channel }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      setProgressPercent(10);
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    // Stage 1 -> 2
    const t1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(38);
    }, 450);

    // Stage 2 -> 3
    const t2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(72);
    }, 1100);

    // Stage 3 -> 4
    const t3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(94);
    }, 1950);

    return () => {
      clearInterval(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Enterprise Brand Governance Audit
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating draft for <span className="font-medium text-slate-700 capitalize">{channel}</span> distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Audit Pipeline Execution</span>
            <span className="font-mono text-indigo-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="space-y-2.5 pt-1">
          {AUDIT_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-indigo-50/60 border-indigo-200/80 shadow-2xs'
                    : isCompleted
                    ? 'bg-slate-50/80 border-slate-200/60 opacity-90'
                    : 'bg-white border-slate-100 opacity-50'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold ${
                        isCurrent
                          ? 'text-indigo-950 font-semibold'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-indigo-600'
                          : 'text-slate-300'
                      }`}
                    >
                      {isCompleted ? 'Verified' : isCurrent ? 'Analyzing...' : 'Queued'}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 text-[11px] leading-relaxed ${
                      isCurrent ? 'text-indigo-900/80' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {stage.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            <span>Dual-engine verification: Heuristics & Gemini 3.8</span>
          </div>
          <span>Please wait a moment...</span>
        </div>
      </div>
    </div>
  );
};
