import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  FileText,
  History,
  Info,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { InkloomLogo } from './InkloomLogo.js';

import type { Brand } from '../types/index.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLoadDemo: () => void;
  onResetDemo: () => void;
  geminiConfigured: boolean;
  geminiModel: string;
  onOpenSearch: () => void;
  brands?: Brand[];
  activeBrand?: Brand | null;
  onSelectBrand?: (brand: Brand) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onLoadDemo,
  onResetDemo,
  geminiConfigured: _geminiConfigured,
  geminiModel,
  onOpenSearch,
  brands,
  activeBrand,
  onSelectBrand,
}) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.platform) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'knowledge', label: 'Brand Hub', icon: BookOpen },
    { id: 'auditor', label: 'Auditor', icon: FileCheck2 },
    { id: 'claims', label: 'Claims', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'about', label: 'Standards', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4 lg:gap-6">
          {/* Zone 1: Bespoke Brand Lockup & Brand Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <InkloomLogo
              size="md"
              subtitle="Brand Governance"
              onClick={() => setCurrentTab('overview')}
            />

            {brands && brands.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 pl-1.5 pr-0.5">Brand:</span>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBrand?.(b)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeBrand?.id === b.id
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
          </div>

          {/* Zone 2: Navigation Links (Single-Line, Quiet Typography) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Global Search Bar, Engine Status, & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Command/Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="group flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/70 rounded-lg transition-all text-xs cursor-pointer w-38 sm:w-56 md:w-64"
              title="Search rules, claims, audits, and actions (⌘K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                <span className="truncate text-slate-500 group-hover:text-slate-700">
                  Search rules, claims...
                </span>
              </div>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-600 bg-white border border-slate-200 rounded shadow-2xs shrink-0">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>

            {/* Model Tag */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 px-2 py-1 rounded bg-slate-50 border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-[10px]">{geminiModel}</span>
            </div>

            {/* Reset Demo Button */}
            <button
              onClick={onResetDemo}
              title="Reset data to initial baseline"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Load Sample Audit Action */}
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Sample Audit</span>
              <span className="sm:hidden">Audit</span>
            </button>
          </div>
        </div>

        {/* Medium and Mobile Navigation Tabs */}
        <div className="lg:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
