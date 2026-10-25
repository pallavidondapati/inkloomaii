/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { OverviewTab } from './components/OverviewTab.js';
import { BrandKnowledgeHubTab } from './components/BrandKnowledgeHubTab.js';
import { ContentAuditorTab } from './components/ContentAuditorTab.js';
import { ClaimsRegistryTab } from './components/ClaimsRegistryTab.js';
import { ReviewHistoryTab } from './components/ReviewHistoryTab.js';
import { SettingsAboutTab } from './components/SettingsAboutTab.js';
import { CommandPaletteModal } from './components/CommandPaletteModal.js';
import {
  fetchHealth,
  fetchBrands,
  fetchRules,
  createRuleApi,
  updateRuleApi,
  deleteRuleApi,
  fetchClaims,
  createClaimApi,
  updateClaimApi,
  deleteClaimApi,
  runAuditApi,
  runRecheckApi,
  fetchAudits,
  submitReviewDecisionApi,
  fetchMetrics,
  resetDemoApi,
} from './services/api.js';
import type {
  Brand,
  BrandRule,
  ApprovedClaim,
  AuditRecord,
  DashboardMetrics,
} from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [claims, setClaims] = useState<ApprovedClaim[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [currentAudit, setCurrentAudit] = useState<AuditRecord | null>(null);

  // Command Palette & Search States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [highlightedClaimId, setHighlightedClaimId] = useState<string | null>(null);
  const [highlightedAuditId, setHighlightedAuditId] = useState<string | null>(null);

  // Health and System Status
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(true);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [healthData, brandsData, rulesData, claimsData, auditsData, metricsData] =
        await Promise.all([
          fetchHealth().catch(() => ({
            geminiConfigured: false,
            geminiModel: 'gemini-3.8-flash',
          })),
          fetchBrands().catch(() => []),
          fetchRules().catch(() => []),
          fetchClaims().catch(() => []),
          fetchAudits().catch(() => []),
          fetchMetrics().catch(() => null),
        ]);

      setGeminiConfigured(Boolean(healthData.geminiConfigured));
      setGeminiModel(healthData.geminiModel || 'gemini-3.8-flash');
      setBrands(brandsData);
      if (brandsData.length > 0) {
        const initialBrand = brandsData[0];
        setActiveBrand(initialBrand);
        const [scopedRules, scopedClaims] = await Promise.all([
          fetchRules(initialBrand.id).catch(() => []),
          fetchClaims(initialBrand.id).catch(() => []),
        ]);
        setRules(scopedRules);
        setClaims(scopedClaims);
      } else {
        setRules(rulesData);
        setClaims(claimsData);
      }
      setAudits(auditsData);
      setMetrics(metricsData);

      if (auditsData.length > 0 && !currentAudit) {
        setCurrentAudit(auditsData[0]);
      }
    } catch (err) {
      console.error('Initial data load error:', err);
      showNotification('Unable to sync with backend server. Check connection.', 'error');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSelectBrand = async (newBrand: Brand) => {
    setActiveBrand(newBrand);
    try {
      const [rulesData, claimsData] = await Promise.all([
        fetchRules(newBrand.id).catch(() => []),
        fetchClaims(newBrand.id).catch(() => []),
      ]);
      setRules(rulesData);
      setClaims(claimsData);
      setCurrentAudit(null);
      showNotification(`Switched brand to ${newBrand.name} (${rulesData.length} rules loaded)`, 'info');
    } catch (err) {
      console.error('Error switching brand:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global Keyboard Listener for Cmd+K / Ctrl+K and /
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Quick slash '/' search when not inside an input field
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Command Palette Item Selection Handlers
  const handleSelectRuleFromSearch = (rule: BrandRule) => {
    setCurrentTab('knowledge');
    setHighlightedRuleId(rule.id);
    setTimeout(() => {
      setHighlightedRuleId(null);
    }, 3500);
  };

  const handleSelectClaimFromSearch = (claim: ApprovedClaim) => {
    setCurrentTab('claims');
    setHighlightedClaimId(claim.id);
    setTimeout(() => {
      setHighlightedClaimId(null);
    }, 3500);
  };

  const handleSelectAuditFromSearch = (audit: AuditRecord) => {
    setCurrentAudit(audit);
    setCurrentTab('history');
    setHighlightedAuditId(audit.id);
    setTimeout(() => {
      setHighlightedAuditId(null);
    }, 3500);
  };

  // Handlers
  const handleLoadDemo = () => {
    setCurrentTab('auditor');
    showNotification(
      'Loaded sample campaign draft. Click "Run Brand Governance Audit" to verify.',
      'info'
    );
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoApi();
      await loadData();
      showNotification('Brand rules and claims registry reset to standard baseline.', 'success');
    } catch (err) {
      showNotification('Failed to reset data.', 'error');
    }
  };

  const handleRunAudit = async (params: {
    brandId: string;
    title: string;
    channel: string;
    content: string;
  }): Promise<AuditRecord> => {
    setIsLoading(true);
    try {
      const audit = await runAuditApi(params);
      setCurrentAudit(audit);
      const [updatedAudits, updatedMetrics] = await Promise.all([
        fetchAudits(params.brandId),
        fetchMetrics(params.brandId),
      ]);
      setAudits(updatedAudits);
      setMetrics(updatedMetrics);
      showNotification(
        `Audit complete: ${audit.findings.length} issues identified · ${audit.score}% compliance rating`,
        'success'
      );
      return audit;
    } catch (err) {
      showNotification((err as Error).message || 'Audit execution failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRecheck = async (params: {
    parentAuditId: string;
    brandId: string;
    title: string;
    channel: string;
    content: string;
  }): Promise<AuditRecord> => {
    setIsLoading(true);
    try {
      const audit = await runRecheckApi(params);
      setCurrentAudit(audit);
      const [updatedAudits, updatedMetrics] = await Promise.all([
        fetchAudits(params.brandId),
        fetchMetrics(params.brandId),
      ]);
      setAudits(updatedAudits);
      setMetrics(updatedMetrics);
      showNotification(
        `Re-audit complete: Version ${audit.versionNumber} generated · ${audit.score}% compliance rating`,
        'success'
      );
      return audit;
    } catch (err) {
      showNotification((err as Error).message || 'Recheck failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (
    auditId: string,
    decision: 'approved' | 'needs_changes',
    reviewerName: string,
    reason: string
  ): Promise<void> => {
    try {
      const updated = await submitReviewDecisionApi(auditId, {
        decision,
        reviewerName,
        reason,
      });
      setCurrentAudit(updated);
      const [updatedAudits, updatedMetrics] = await Promise.all([
        fetchAudits(),
        fetchMetrics(),
      ]);
      setAudits(updatedAudits);
      setMetrics(updatedMetrics);
      showNotification(
        `Review decision recorded: ${decision.toUpperCase()} by ${reviewerName}`,
        'success'
      );
    } catch (err) {
      showNotification('Failed to record review decision', 'error');
      throw err;
    }
  };

  // Rule Handlers
  const handleAddRule = async (ruleData: Partial<BrandRule>) => {
    try {
      await createRuleApi(ruleData);
      const updatedRules = await fetchRules(activeBrand?.id);
      setRules(updatedRules);
      showNotification('Brand rule registered successfully.', 'success');
    } catch (err) {
      showNotification('Failed to create brand rule', 'error');
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<BrandRule>) => {
    try {
      await updateRuleApi(id, updates);
      const updatedRules = await fetchRules(activeBrand?.id);
      setRules(updatedRules);
      showNotification('Brand rule updated.', 'success');
    } catch (err) {
      showNotification('Failed to update brand rule', 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRuleApi(id);
      const updatedRules = await fetchRules(activeBrand?.id);
      setRules(updatedRules);
      showNotification('Brand rule removed.', 'info');
    } catch (err) {
      showNotification('Failed to delete rule', 'error');
    }
  };

  // Claim Handlers
  const handleAddClaim = async (claimData: Partial<ApprovedClaim>) => {
    try {
      await createClaimApi(claimData);
      const updatedClaims = await fetchClaims(activeBrand?.id);
      setClaims(updatedClaims);
      showNotification('Claim statement registered.', 'success');
    } catch (err) {
      showNotification('Failed to create claim', 'error');
    }
  };

  const handleUpdateClaim = async (id: string, updates: Partial<ApprovedClaim>) => {
    try {
      await updateClaimApi(id, updates);
      const updatedClaims = await fetchClaims(activeBrand?.id);
      setClaims(updatedClaims);
      showNotification('Claim statement updated.', 'success');
    } catch (err) {
      showNotification('Failed to update claim', 'error');
    }
  };

  const handleDeleteClaim = async (id: string) => {
    try {
      await deleteClaimApi(id);
      const updatedClaims = await fetchClaims(activeBrand?.id);
      setClaims(updatedClaims);
      showNotification('Claim removed from registry.', 'info');
    } catch (err) {
      showNotification('Failed to delete claim', 'error');
    }
  };

  const handleOpenAudit = (audit: AuditRecord) => {
    setCurrentAudit(audit);
    setCurrentTab('auditor');
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold mb-3 shadow-2xs">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        </div>
        <div className="text-xs font-semibold text-slate-700 tracking-tight">
          Connecting to Inkloom Brand Engine
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Loading active rules and claims registry...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-fade-in">
          <div
            className={`p-3.5 rounded-lg shadow-lg text-xs font-medium flex items-center justify-between border ${
              notification.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : notification.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
        geminiConfigured={geminiConfigured}
        geminiModel={geminiModel}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        brands={brands}
        activeBrand={activeBrand}
        onSelectBrand={handleSelectBrand}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'overview' && (
          <OverviewTab
            metrics={metrics}
            recentAudits={audits}
            activeBrand={activeBrand}
            onNavigateToAuditor={() => setCurrentTab('auditor')}
            onLoadDemo={handleLoadDemo}
            onOpenAudit={handleOpenAudit}
          />
        )}

        {currentTab === 'knowledge' && (
          <BrandKnowledgeHubTab
            brand={activeBrand}
            rules={rules}
            onAddRule={handleAddRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            highlightedRuleId={highlightedRuleId}
          />
        )}

        {currentTab === 'auditor' && (
          <ContentAuditorTab
            brand={activeBrand}
            brands={brands}
            onSelectBrand={handleSelectBrand}
            currentAudit={currentAudit}
            onRunAudit={handleRunAudit}
            onRunRecheck={handleRunRecheck}
            onSubmitReview={handleSubmitReview}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'claims' && (
          <ClaimsRegistryTab
            brand={activeBrand}
            claims={claims}
            onAddClaim={handleAddClaim}
            onUpdateClaim={handleUpdateClaim}
            onDeleteClaim={handleDeleteClaim}
            highlightedClaimId={highlightedClaimId}
          />
        )}

        {currentTab === 'history' && (
          <ReviewHistoryTab
            audits={audits}
            onOpenAudit={handleOpenAudit}
            onSubmitReview={handleSubmitReview}
            highlightedAuditId={highlightedAuditId}
          />
        )}

        {currentTab === 'about' && <SettingsAboutTab />}
      </main>

      {/* Global Command & Search Palette Overlay */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        rules={rules}
        claims={claims}
        audits={audits}
        onNavigateTab={(tabId) => setCurrentTab(tabId)}
        onSelectRule={handleSelectRuleFromSearch}
        onSelectClaim={handleSelectClaimFromSearch}
        onSelectAudit={handleSelectAuditFromSearch}
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
      />

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Inkloom AI</span>
            <span>•</span>
            <span>Enterprise Brand Governance & Pre-Publication Verification Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Server: Express on Port 3000</span>
            <span>•</span>
            <span>Storage: Persistent JSON Database</span>
            <span>•</span>
            <span>AI: Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
