export interface EnterpriseCopyPreset {
  id: string;
  scenarioCode: 'A' | 'B' | 'C' | 'D';
  name: string;
  category: string;
  description: string;
  expectedOutcome: string;
  riskLevel: 'high' | 'compliant' | 'evidence_needed';
  channel: 'website' | 'email' | 'social' | 'press_release' | 'ad_copy' | 'blog';
  title: string;
  content: string;
  fictionalLabel: string;
  brandId?: string;
}

export const ENTERPRISE_PRESETS: EnterpriseCopyPreset[] = [
  {
    id: 'scenario-a-non-compliant',
    scenarioCode: 'A',
    name: 'Scenario A — Non-compliant content',
    category: 'SLA & Terminology Breaches',
    description:
      'Contains prohibited absolute guarantees, trademark misspelling (LuminoMesh), inflated 99.999% uptime SLA, competitor attacks, and an unsupported 45,000 customer claim.',
    expectedOutcome:
      'Flags critical SLA contradictions, prohibited terminology, competitor tone violations, and unsupported customer count.',
    riskLevel: 'high',
    channel: 'website',
    title: 'Lumino Cloud Q4 Infrastructure Launch (Fictional)',
    fictionalLabel: 'Fictional demo scenario illustrating critical violations and prohibited claims',
    brandId: 'brand-lumino-cloud',
    content: `Accelerate your infrastructure with LuminoMesh, the military-grade hack-proof cloud. Don't be foolish enough to stick with slow old competitors and their worthless legacy hardware! 

We deliver an unbreakable guarantee of 99.999% uptime across all shared tier subscriptions. Furthermore, our platform is trusted by over 45,000 Fortune 500 enterprises across 180 countries, backed by our ISO-27001:2022 interim standard certification. Experience flawless speed without hesitation today.`,
  },
  {
    id: 'scenario-b-compliant',
    scenarioCode: 'B',
    name: 'Scenario B — Compliant content',
    category: 'Approved Enterprise Baseline',
    description:
      'Uses only explicitly approved brand claims, official trademark naming, approved 99.9% Enterprise Tier SLA, and ISO/IEC 27001:2025 standard.',
    expectedOutcome:
      'Passes verified brand checks with 100% compliance score, ready for human review sign-off.',
    riskLevel: 'compliant',
    channel: 'website',
    title: 'Lumino Cloud Mesh Enterprise Infrastructure Announcement (Fictional)',
    fictionalLabel: 'Fictional demo scenario demonstrating 100% verified compliance alignment',
    brandId: 'brand-lumino-cloud',
    content: `Accelerate your infrastructure with Lumino Cloud Mesh, engineered for modern enterprise reliability. Move beyond traditional architectures and streamline your operations with cloud-native elasticity.

We provide a guaranteed 99.9% uptime SLA exclusively for Enterprise Tier workloads with multi-region failover. Backed by our SOC 2 Type II and ISO/IEC 27001:2025 audited security framework, Lumino Cloud serves over 1,400 audited enterprise clients globally with verified sub-45ms cold-start latency. Discover our enterprise solutions today.`,
  },
  {
    id: 'scenario-c-insufficient-evidence',
    scenarioCode: 'C',
    name: 'Scenario C — Insufficient evidence (Evidence Needed)',
    category: 'Unverified Performance Claims',
    description:
      'Includes an unverified claim ("reduces cloud egress networking expenses by 68%") that is neither in the registry nor explicitly prohibited. Demonstrates that unsupported claims are marked as "Evidence needed" rather than falsely declared untrue.',
    expectedOutcome:
      'Flags "Evidence needed" for the 68% egress reduction claim without declaring it false.',
    riskLevel: 'evidence_needed',
    channel: 'website',
    title: 'Lumino Cloud Mesh Edge Compression Briefing (Fictional)',
    fictionalLabel: 'Fictional demo scenario demonstrating evidence-needed governance handling',
    brandId: 'brand-lumino-cloud',
    content: `Deploy high-throughput microservices on Lumino Cloud Mesh. Our intelligent distributed routing reduces cloud egress networking expenses by 68% compared to traditional hyperscalers, while maintaining low-latency packet delivery across global nodes.

Explore our enterprise mesh deployment options today with verified SOC 2 Type II compliance.`,
  },
];

export const SUNSCREEN_PRESETS: EnterpriseCopyPreset[] = [
  {
    id: 'solaris-scenario-a-non-compliant',
    scenarioCode: 'A',
    name: 'Scenario A — Non-compliant sunscreen copy',
    category: 'Medical Claims & Trademark Misspelling',
    description:
      'Contains prohibited medical claims ("cures skin cancer", "miracle cure", "reverses aging"), absolute SPF guarantee ("100% sunblock"), and brand misspelling ("SolarisSun"). Uses "flawless" in acceptable cosmetic context.',
    expectedOutcome:
      'Flags critical unapproved medical claims and trademark misspelling. Does NOT cite irrelevant software policies for "flawless".',
    riskLevel: 'high',
    channel: 'website',
    title: 'Solaris Daily Sun Protection Campaign Launch (Fictional)',
    fictionalLabel: 'Fictional sunscreen demo scenario illustrating prohibited medical claims and trademark violations',
    brandId: 'brand-solaris-sunscreen',
    content: `Protect your family with SolarisSun, the miracle cure for sun damage that cures skin cancer and permanently reverses aging! 

Our magic formula provides 100% sunblock with a flawless natural finish all day. Formulated for everyday sun exposure and tested by dermatologists across the country.`,
  },
  {
    id: 'solaris-scenario-b-compliant',
    scenarioCode: 'B',
    name: 'Scenario B — Compliant sunscreen copy',
    category: 'Approved Sunscreen Standards',
    description:
      'Uses only explicitly approved brand claims, registered trademark naming ("Solaris Mineral Sunscreen"), approved SPF 50, and 80-minute water resistance.',
    expectedOutcome:
      'Passes verified sunscreen checks with 100% compliance score, ready for human sign-off.',
    riskLevel: 'compliant',
    channel: 'website',
    title: 'Solaris Mineral Sunscreen Daily Defense Announcement (Fictional)',
    fictionalLabel: 'Fictional sunscreen demo scenario demonstrating 100% verified compliance alignment',
    brandId: 'brand-solaris-sunscreen',
    content: `Protect your skin every day with Solaris Mineral Sunscreen. Formulated with 20% non-nano zinc oxide, our gentle mineral lotion delivers Broad Spectrum SPF 50 mineral protection powered by 20% non-nano zinc oxide. 

Water resistant for up to 80 minutes of swimming or sweating. Dermatologist tested and non-comedogenic on sensitive skin for a flawless natural finish.`,
  },
  {
    id: 'solaris-scenario-c-insufficient-evidence',
    scenarioCode: 'C',
    name: 'Scenario C — Insufficient evidence (Evidence Needed)',
    category: 'Unverified Clinical Efficacy Claims',
    description:
      'Includes an unverified claim ("reduces UV sunspots by 74%") that is neither in the registry nor explicitly prohibited. Demonstrates that unsupported claims are marked as "Evidence needed" rather than falsely declared untrue.',
    expectedOutcome:
      'Flags "Evidence needed" for the 74% sunspot reduction claim without declaring it false.',
    riskLevel: 'evidence_needed',
    channel: 'website',
    title: 'Solaris Mineral Daily Defense Briefing (Fictional)',
    fictionalLabel: 'Fictional sunscreen demo scenario demonstrating evidence-needed governance handling',
    brandId: 'brand-solaris-sunscreen',
    content: `Solaris Mineral Sunscreen provides broad spectrum SPF 50 daily defense with mineral zinc oxide. Our active botanical formula reduces UV sunspots by 74% within 14 days of daily application, leaving a flawless matte look.

Dermatologist tested and water resistant for up to 80 minutes.`,
  },
];

export function getPresetsForBrand(brandId?: string): EnterpriseCopyPreset[] {
  if (brandId === 'brand-solaris-sunscreen') {
    return SUNSCREEN_PRESETS;
  }
  return ENTERPRISE_PRESETS;
}

export const DEMO_FLAWED_DRAFT = {
  title: ENTERPRISE_PRESETS[0].title,
  channel: ENTERPRISE_PRESETS[0].channel,
  content: ENTERPRISE_PRESETS[0].content,
};

export const DEMO_CORRECTED_DRAFT = {
  title: ENTERPRISE_PRESETS[1].title,
  channel: ENTERPRISE_PRESETS[1].channel,
  content: ENTERPRISE_PRESETS[1].content,
};
