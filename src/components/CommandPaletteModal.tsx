import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  FileText,
  FileCheck2,
  Compass,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CornerDownLeft,
} from 'lucide-react';
import type {
  BrandRule,
  ApprovedClaim,
  AuditRecord,
} from '../types/index.js';

export type SearchCategoryFilter = 'all' | 'rules' | 'claims' | 'audits' | 'actions';

export interface CommandPaletteItem {
  id: string;
  type: 'rule' | 'claim' | 'audit' | 'action';
  title: string;
  subtitle: string;
  categoryLabel: string;
  badge?: string;
  rawItem?: BrandRule | ApprovedClaim | AuditRecord | any;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: BrandRule[];
  claims: ApprovedClaim[];
  audits: AuditRecord[];
  onNavigateTab: (tabId: string) => void;
  onSelectRule: (rule: BrandRule) => void;
  onSelectClaim: (claim: ApprovedClaim) => void;
  onSelectAudit: (audit: AuditRecord) => void;
  onLoadDemo: () => void;
  onResetDemo: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  rules,
  claims,
  audits,
  onNavigateTab,
  onSelectRule,
  onSelectClaim,
  onSelectAudit,
  onLoadDemo,
  onResetDemo,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset selection
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build searchable items catalogue
  const allItems: CommandPaletteItem[] = useMemo(() => {
    const items: CommandPaletteItem[] = [];

    // 1. Navigation & Quick Actions
    const defaultActions: CommandPaletteItem[] = [
      {
        id: 'action-audit',
        type: 'action',
        title: 'Run Brand Governance Audit',
        subtitle: 'Inspect marketing text against active rules and approved claims',
        categoryLabel: 'Quick Action',
        action: () => {
          onNavigateTab('auditor');
          onClose();
        },
      },
      {
        id: 'action-sample',
        type: 'action',
        title: 'Load Test Campaign Draft',
        subtitle: 'Simulate high-risk enterprise cloud draft with known claim violations',
        categoryLabel: 'Quick Action',
        action: () => {
          onLoadDemo();
          onClose();
        },
      },
      {
        id: 'action-rules-hub',
        type: 'action',
        title: 'Brand Knowledge Hub',
        subtitle: 'Manage prohibited terminology, tone policies, and factual boundaries',
        categoryLabel: 'Navigation',
        action: () => {
          onNavigateTab('knowledge');
          onClose();
        },
      },
      {
        id: 'action-claims-reg',
        type: 'action',
        title: 'Claims Registry',
        subtitle: 'Inspect legal evidence, benchmarks, and temporal validity scopes',
        categoryLabel: 'Navigation',
        action: () => {
          onNavigateTab('claims');
          onClose();
        },
      },
      {
        id: 'action-review-hist',
        type: 'action',
        title: 'Audit Review History',
        subtitle: 'View audit runs, scores, channel breakdowns, and formal sign-offs',
        categoryLabel: 'Navigation',
        action: () => {
          onNavigateTab('history');
          onClose();
        },
      },
      {
        id: 'action-reset-baseline',
        type: 'action',
        title: 'Reset Baseline Governance Data',
        subtitle: 'Restore Lumino Cloud rules and claims to standard benchmark state',
        categoryLabel: 'Quick Action',
        action: () => {
          onResetDemo();
          onClose();
        },
      },
    ];

    items.push(...defaultActions);

    // 2. Brand Rules
    for (const rule of rules) {
      const prohibitedPreview = rule.prohibitedWording?.length
        ? `Prohibited: "${rule.prohibitedWording.slice(0, 2).join('", "')}"`
        : '';
      const requiredPreview = rule.requiredWording?.length
        ? `Requires: "${rule.requiredWording.slice(0, 2).join('", "')}"`
        : '';
      const wordingDetail = [prohibitedPreview, requiredPreview].filter(Boolean).join(' · ');

      items.push({
        id: `rule-${rule.id}`,
        type: 'rule',
        title: rule.title,
        subtitle: wordingDetail
          ? `${rule.description} (${wordingDetail})`
          : rule.description,
        categoryLabel: `Brand Rule · ${rule.category.replace('_', ' ')}`,
        badge: rule.severity.toUpperCase(),
        rawItem: rule,
        action: () => {
          onSelectRule(rule);
          onClose();
        },
      });
    }

    // 3. Approved Claims
    for (const claim of claims) {
      items.push({
        id: `claim-${claim.id}`,
        type: 'claim',
        title: claim.claimText,
        subtitle: `Evidence: ${claim.supportingEvidence} · Scope: ${claim.productScope || 'All Enterprise'}`,
        categoryLabel: `Claim · ${claim.status.toUpperCase()}`,
        badge: claim.status,
        rawItem: claim,
        action: () => {
          onSelectClaim(claim);
          onClose();
        },
      });
    }

    // 4. Past Audits
    for (const audit of audits) {
      items.push({
        id: `audit-${audit.id}`,
        type: 'audit',
        title: audit.title,
        subtitle: `${audit.channel.toUpperCase()} · ${audit.score}% compliance · ${audit.findings.length} findings · ${new Date(audit.timestamp).toLocaleDateString()}`,
        categoryLabel: 'Audit Record',
        badge: `${audit.score}% Score`,
        rawItem: audit,
        action: () => {
          onSelectAudit(audit);
          onClose();
        },
      });
    }

    return items;
  }, [rules, claims, audits, onNavigateTab, onLoadDemo, onResetDemo, onSelectRule, onSelectClaim, onSelectAudit, onClose]);

  // Filter items based on activeFilter and query
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Filter by type
    if (activeFilter === 'rules') {
      result = result.filter((i) => i.type === 'rule');
    } else if (activeFilter === 'claims') {
      result = result.filter((i) => i.type === 'claim');
    } else if (activeFilter === 'audits') {
      result = result.filter((i) => i.type === 'audit');
    } else if (activeFilter === 'actions') {
      result = result.filter((i) => i.type === 'action');
    }

    // Filter by query
    if (query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      result = result.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = item.subtitle.toLowerCase().includes(q);
        const catMatch = item.categoryLabel.toLowerCase().includes(q);

        // Deeper matching for rules
        let extraMatch = false;
        if (item.type === 'rule' && item.rawItem) {
          const r = item.rawItem as BrandRule;
          extraMatch =
            Boolean(r.prohibitedWording?.some((p) => p.toLowerCase().includes(q))) ||
            Boolean(r.requiredWording?.some((rw) => rw.toLowerCase().includes(q))) ||
            Boolean(r.supportingSource?.toLowerCase().includes(q));
        } else if (item.type === 'claim' && item.rawItem) {
          const c = item.rawItem as ApprovedClaim;
          extraMatch =
            Boolean(c.supportingEvidence?.toLowerCase().includes(q)) ||
            Boolean(c.tags?.some((t) => t.toLowerCase().includes(q)));
        } else if (item.type === 'audit' && item.rawItem) {
          const a = item.rawItem as AuditRecord;
          extraMatch =
            Boolean(a.content?.toLowerCase().includes(q)) ||
            Boolean(a.findings?.some((f) => f.title.toLowerCase().includes(q) || f.quotedText.toLowerCase().includes(q)));
        }

        return titleMatch || subMatch || catMatch || extraMatch;
      });
    }

    return result.slice(0, 30); // Cap at 30 items for smooth render
  }, [allItems, activeFilter, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (filteredItems.length === 0) return 0;
      if (prev >= filteredItems.length) return filteredItems.length - 1;
      return prev;
    });
  }, [filteredItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const filterKeys: SearchCategoryFilter[] = ['all', 'rules', 'claims', 'audits', 'actions'];
      const currentIndex = filterKeys.indexOf(activeFilter);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + filterKeys.length) % filterKeys.length
        : (currentIndex + 1) % filterKeys.length;
      setActiveFilter(filterKeys[nextIndex]);
      setSelectedIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-white">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search brand rules, approved claims, audit runs, or actions..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/80 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Results' },
              { id: 'rules', label: 'Rules', count: rules.length },
              { id: 'claims', label: 'Claims', count: claims.length },
              { id: 'audits', label: 'Audits', count: audits.length },
              { id: 'actions', label: 'Quick Actions' },
            ] as const
          ).map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {filter.label}
                {'count' in filter && filter.count !== undefined && (
                  <span className="ml-1 text-[11px] text-slate-400">({filter.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5">
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-slate-800">
                No matches found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching for specific brand terms (e.g. &quot;uptime&quot;, &quot;SLA&quot;, &quot;mesh&quot;), claim scopes, or clear the category filter.
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                >
                  Search in all categories
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              // Choose icon
              let Icon = Compass;
              let iconColor = 'text-slate-500';
              if (item.type === 'rule') {
                Icon = BookOpen;
                iconColor = 'text-indigo-600';
              } else if (item.type === 'claim') {
                Icon = FileText;
                iconColor = 'text-emerald-600';
              } else if (item.type === 'audit') {
                Icon = FileCheck2;
                iconColor = 'text-sky-600';
              } else if (item.type === 'action') {
                Icon = Sparkles;
                iconColor = 'text-amber-500';
              }

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={item.action}
                  className={`flex items-start justify-between gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100/90 text-slate-900 ring-1 ring-slate-200/60'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
                            · {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1 capitalize font-medium">
                        {item.categoryLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 text-slate-400 self-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↵
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                Tab
              </kbd>
              <span>Filter category</span>
            </span>
          </div>

          <div className="text-slate-400">
            <span>{filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
