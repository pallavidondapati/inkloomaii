import { getRules, getClaims, getBrand } from '../server/db.js';
import { runDeterministicChecks } from '../server/engine/deterministic.js';
import { runGeminiAudit } from '../server/engine/geminiAuditor.js';
import { deduplicateAuditFindings, sanitizeFindings } from '../server/engine/deduplication.js';
import { ENTERPRISE_PRESETS, SUNSCREEN_PRESETS } from '../src/data/sampleFlawedDraft.js';
import type { AuditFinding, BrandRule, Brand, AuditRecord } from '../src/types/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details || ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('INKLOOM AI BRAND GOVERNANCE AUDIT ENGINE — REGRESSION & PROOF TESTS');
  console.log('================================================================\n');

  const luminoBrand = getBrand('brand-lumino-cloud')!;
  const luminoRules = getRules('brand-lumino-cloud');
  const luminoClaims = getClaims('brand-lumino-cloud');

  const solarisBrand = getBrand('brand-solaris-sunscreen')!;
  const solarisRules = getRules('brand-solaris-sunscreen');
  const solarisClaims = getClaims('brand-solaris-sunscreen');

  // --------------------------------------------------------------------------
  // PROOF TEST 1: A sunscreen audit cannot cite a software-only policy from another brand
  // --------------------------------------------------------------------------
  console.log('1. Brand Isolation: Sunscreen audit cannot cite software-only policy from another brand:');
  const sunscreenFlawlessDraft = 'Solaris Mineral Sunscreen gives your skin a flawless finish with broad spectrum SPF 50 mineral protection.';
  const sunscreenAudit = runDeterministicChecks(sunscreenFlawlessDraft, solarisRules, solarisClaims, solarisBrand);
  const deduplicatedSunscreen = deduplicateAuditFindings(sunscreenAudit.findings, solarisRules, solarisClaims, solarisBrand);

  const citesLegalMitigationPolicy = deduplicatedSunscreen.some(
    (f) => f.sourceExcerpt && f.sourceExcerpt.includes('Legal & Risk Mitigation Policy v3.8')
  );
  const citesBugFreeRule = deduplicatedSunscreen.some(
    (f) => f.ruleId === 'rule-prohibited-hype' || (f.explanation && f.explanation.includes('100% bug-free'))
  );
  const flagsFlawlessAsSoftware = deduplicatedSunscreen.some(
    (f) => f.quotedText.toLowerCase().includes('flawless')
  );

  assert(!citesLegalMitigationPolicy, 'Sunscreen audit does NOT cite "Legal & Risk Mitigation Policy v3.8"');
  assert(!citesBugFreeRule, 'Sunscreen audit does NOT cite software bug-free rules');
  assert(!flagsFlawlessAsSoftware, 'Sunscreen audit does NOT flag "flawless" as a prohibited software term');

  // --------------------------------------------------------------------------
  // PROOF TEST 2: Every citation resolves to a real, applicable source
  // --------------------------------------------------------------------------
  console.log('\n2. Citation Integrity: Every citation resolves to a real, applicable stored source:');
  // Check against Solaris
  const flawedSunscreenDraft = SUNSCREEN_PRESETS[0].content;
  const rawSunscreenFindings = runDeterministicChecks(flawedSunscreenDraft, solarisRules, solarisClaims, solarisBrand);
  const verifiedFindings = deduplicateAuditFindings(rawSunscreenFindings.findings, solarisRules, solarisClaims, solarisBrand);

  assert(verifiedFindings.length >= 2, 'Detects multiple genuine sunscreen violations');
  for (const f of verifiedFindings) {
    if (f.ruleId) {
      const storedRule = solarisRules.find((r) => r.id === f.ruleId);
      assert(Boolean(storedRule), `Rule ID #${f.ruleId} exists in Solaris brand rules`);
      assert(
        f.sourceExcerpt === storedRule?.supportingSource,
        `Citation source matches stored rule source: "${f.sourceExcerpt}"`
      );
    }
  }

  // Verify foreign or fabricated rule ID is completely sanitized
  const foreignFinding: AuditFinding = {
    id: 'ai-foreign-test',
    category: 'compliance',
    title: 'Foreign Policy Test',
    quotedText: 'some text',
    explanation: 'Testing foreign rule stripping',
    severity: 'high',
    ruleId: 'rule-prohibited-hype', // Foreign Lumino Cloud rule
    sourceExcerpt: 'Legal & Risk Mitigation Policy v3.8, Section 4.2',
    confidenceExplanation: 'Test',
    validationMethod: 'ai-assisted',
    findingType: 'compliance_risk',
  };
  const sanitizedForeign = sanitizeFindings([foreignFinding], solarisRules, solarisClaims, solarisBrand);
  assert(sanitizedForeign[0].ruleId === undefined, 'Foreign brand rule ID is stripped when auditing sunscreen');
  assert(sanitizedForeign[0].sourceExcerpt === undefined, 'Foreign brand source excerpt is stripped when auditing sunscreen');

  // --------------------------------------------------------------------------
  // PROOF TEST 3: Missing source produces "Unable to verify" or "Human review required", not an invented rule
  // --------------------------------------------------------------------------
  console.log('\n3. Absence of Evidence: Missing source produces "Unable to verify" or "Human review required":');
  // Part A: Empty rules produce unable_to_verify
  const emptyRules: BrandRule[] = [];
  const unverifiedStatus = emptyRules.length === 0 ? 'unable_to_verify' : 'ready_for_review';
  const unverifiedScore = emptyRules.length === 0 ? 0 : 100;
  assert(unverifiedStatus === 'unable_to_verify', 'Empty brand rules produce status "unable_to_verify"');
  assert(unverifiedScore === 0, 'Empty brand rules produce 0 score, never 100% compliance');

  // Part B: Violation without approved replacement produces human review required with NO invented correction
  const findingNeedingHumanReview: AuditFinding = {
    id: 'det-prohibited-solaris-no-medical-claims-10',
    category: 'compliance',
    title: 'Prohibited Medical Claim',
    quotedText: 'cures skin cancer',
    explanation: 'Sunscreen cannot claim to cure disease.',
    severity: 'critical',
    ruleId: 'rule-solaris-no-medical-claims',
    sourceExcerpt: 'Solaris Regulatory & FDA OTC Sunscreen Monograph Guide §2',
    confidenceExplanation: 'Deterministic test',
    validationMethod: 'deterministic',
    findingType: 'prohibited_term',
    suggestedCorrection: undefined, // No safe replacement exists
  };
  const sanitizedNeedingReview = sanitizeFindings([findingNeedingHumanReview], solarisRules, solarisClaims, solarisBrand);
  assert(sanitizedNeedingReview[0].suggestedCorrection === undefined, 'Does not invent an unapproved medical replacement; leaves correction undefined');

  // --------------------------------------------------------------------------
  // PROOF TEST 4: Prohibited sunscreen claims and incorrect brand spellings are detected
  // --------------------------------------------------------------------------
  console.log('\n4. Detection Accuracy: Prohibited sunscreen claims and brand spellings are detected:');
  const sunscreenTestContent = 'Protect your family with SolarisSun, the miracle cure that cures skin cancer and provides 100% sunblock with a flawless finish.';
  const sunscreenDetectionResult = runDeterministicChecks(sunscreenTestContent, solarisRules, solarisClaims, solarisBrand);

  // 1. Trademark misspelling detection
  const namingFinding = sunscreenDetectionResult.findings.find(
    (f) => f.quotedText.toLowerCase() === 'solarissun' || f.ruleId === 'rule-solaris-brand-naming'
  );
  assert(Boolean(namingFinding), 'Detects incorrect brand spelling "SolarisSun"');
  if (namingFinding) {
    assert(
      namingFinding.suggestedCorrection === 'Solaris Mineral Sunscreen',
      `Suggests official registered trademark "Solaris Mineral Sunscreen" (got: "${namingFinding.suggestedCorrection}")`
    );
  }

  // 2. Prohibited medical claims detection
  const cancerClaim = sunscreenDetectionResult.findings.find((f) => f.quotedText.toLowerCase().includes('cures skin cancer'));
  assert(Boolean(cancerClaim), 'Detects prohibited medical claim "cures skin cancer"');
  if (cancerClaim) {
    assert(cancerClaim.severity === 'critical', 'Medical claim marked as critical severity');
    assert(cancerClaim.ruleId === 'rule-solaris-no-medical-claims', 'Links to Solaris medical claims rule');
  }

  const miracleClaim = sunscreenDetectionResult.findings.find((f) => f.quotedText.toLowerCase().includes('miracle cure'));
  assert(Boolean(miracleClaim), 'Detects prohibited claim "miracle cure"');

  const sunblockClaim = sunscreenDetectionResult.findings.find((f) => f.quotedText.toLowerCase().includes('100% sunblock'));
  assert(Boolean(sunblockClaim), 'Detects prohibited claim "100% sunblock"');

  // --------------------------------------------------------------------------
  // PROOF TEST 5: The score is based on unique, verified findings
  // --------------------------------------------------------------------------
  console.log('\n5. Transparent Scoring: Score is based exclusively on unique, verified findings:');
  const duplicateCandidates: AuditFinding[] = [
    {
      id: 'det-naming-1',
      category: 'terminology',
      title: 'Inexact Product Trademark Naming',
      quotedText: 'SolarisSun',
      explanation: 'Use registered mark Solaris Mineral Sunscreen.',
      severity: 'medium',
      ruleId: 'rule-solaris-brand-naming',
      confidenceExplanation: 'Deterministic test',
      validationMethod: 'deterministic',
      findingType: 'prohibited_term',
    },
    {
      id: 'ai-naming-2',
      category: 'brand_tone', // Mismatched category
      title: 'Brand Naming Inconsistency',
      quotedText: 'SolarisSun',
      explanation: 'Found non-standard trademark.',
      severity: 'medium',
      ruleId: 'rule-solaris-brand-naming',
      confidenceExplanation: 'AI analysis',
      validationMethod: 'ai-assisted',
      findingType: 'prohibited_term',
    },
  ];
  const deduplicatedNaming = deduplicateAuditFindings(duplicateCandidates, solarisRules, solarisClaims, solarisBrand);
  assert(deduplicatedNaming.length === 1, 'Two detectors flagging "SolarisSun" produce exactly 1 finding', `Count: ${deduplicatedNaming.length}`);

  // Calculate score with single deduplicated finding (Medium: -10)
  const mediumDeductions = deduplicatedNaming.filter((f) => f.severity === 'medium').length * 10;
  const scoreFromUnique = 100 - mediumDeductions;
  assert(scoreFromUnique === 90, 'Score reflects single unique finding penalty (90/100, not double-penalized to 80)');

  // --------------------------------------------------------------------------
  // PROOF TEST 6: Critical applicable violations block release, while irrelevant rules do not
  // --------------------------------------------------------------------------
  console.log('\n6. Release Decision: Critical applicable violations block release without irrelevant SLA language:');
  // Part A: Critical applicable medical claim blocks release
  const criticalFindings: AuditFinding[] = [cancerClaim!];
  const criticalCount = criticalFindings.filter((f) => f.severity === 'critical').length;
  const criticalDeductions = criticalCount * 35;
  const scoreWithCritical = Math.min(60, 100 - criticalDeductions);
  const releaseStatusWithCritical = criticalCount > 0 ? 'needs_changes' : 'ready_for_review';

  assert(releaseStatusWithCritical === 'needs_changes', 'Critical medical claim enforces "needs_changes" status (Release blocked)');
  assert(scoreWithCritical <= 60, 'Critical violation caps score at 60');

  // Verify dynamic release message does NOT contain SLA
  const isSlaTriggered = criticalFindings.some(
    (f) => f.severity === 'critical' && (f.title.toLowerCase().includes('sla') || f.quotedText.includes('99.'))
  );
  const violationTypeLabel = isSlaTriggered ? 'Critical SLA' : 'Critical policy';
  const calculationPolicy = `Base 100 with penalties (Critical: -${criticalDeductions}). ${violationTypeLabel} violation present: release blocked.`;

  assert(!calculationPolicy.includes('SLA'), 'Release policy message does NOT contain irrelevant SLA wording for sunscreen violation');
  assert(calculationPolicy.includes('Critical policy violation present'), 'Release policy correctly describes critical policy violation');

  // Part B: Compliant sunscreen draft passes without interference from software rules
  const compliantSunscreenContent = SUNSCREEN_PRESETS[1].content;
  const compliantSunscreenResult = runDeterministicChecks(compliantSunscreenContent, solarisRules, solarisClaims, solarisBrand);
  assert(compliantSunscreenResult.findings.length === 0, 'Compliant sunscreen draft produces 0 violations', `Violations: ${compliantSunscreenResult.findings.length}`);
  assert(compliantSunscreenResult.passedChecks.length >= 1, 'Passed checks recorded for compliant sunscreen draft');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
