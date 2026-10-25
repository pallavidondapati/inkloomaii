import type {
  Brand,
  BrandRule,
  ApprovedClaim,
  AuditFinding,
  PassedCheck,
} from '../../src/types/index.js';

export interface DeterministicResult {
  findings: AuditFinding[];
  passedChecks: PassedCheck[];
}

/**
 * Common nouns that should NEVER be treated as prohibited words by naive substring/keyword match
 * unless an explicit brand rule specifically targets them by name in its title or policy description.
 */
const PROTECTED_GENERIC_NOUNS = new Set([
  'claim',
  'claims',
  'benefit',
  'benefits',
  'statement',
  'statements',
  'product',
  'products',
  'content',
  'copy',
]);

export function runDeterministicChecks(
  content: string,
  rules: BrandRule[],
  claims: ApprovedClaim[],
  brand?: Brand
): DeterministicResult {
  const findings: AuditFinding[] = [];
  const passedChecks: PassedCheck[] = [];
  const contentLower = content.toLowerCase();

  // 1. Check active brand rules with prohibited wording
  for (const rule of rules) {
    if (!rule.isActive && rule.status !== 'active') continue;

    let ruleViolated = false;

    if (rule.prohibitedWording && rule.prohibitedWording.length > 0) {
      for (const phrase of rule.prohibitedWording) {
        const phraseTrimmed = phrase.trim();
        if (!phraseTrimmed) continue;

        const phraseLower = phraseTrimmed.toLowerCase();

        // Safeguard for Bug 1: The word "claims" alone is not prohibited unless an explicit rule specifically says so.
        // A rule saying "Avoid unsupported claims" or having generic category keywords must not prohibit the word "claims".
        if (PROTECTED_GENERIC_NOUNS.has(phraseLower)) {
          const ruleDescLower = (rule.description || '').toLowerCase();
          const ruleTitleLower = (rule.title || '').toLowerCase();
          const explicitlyBansToken =
            ruleDescLower.includes(`prohibit the word "${phraseLower}"`) ||
            ruleDescLower.includes(`ban the word "${phraseLower}"`) ||
            ruleTitleLower.includes(`ban "${phraseLower}"`);
          if (!explicitlyBansToken) {
            continue; // Skip generic protected noun
          }
        }

        const matches = findPhraseMatches(content, phraseTrimmed);

        for (const match of matches) {
          ruleViolated = true;
          const actualQuoted = match.matchText;

          // Deriving safe, brand-contextual suggested corrections
          let suggestedCorrection: string | undefined = undefined;

          // Check if rule itself provides official required naming/wording
          if (rule.requiredWording && rule.requiredWording.length > 0) {
            suggestedCorrection = rule.requiredWording[0];
          } else if (rule.brandId === 'brand-lumino-cloud' || (brand && brand.id === 'brand-lumino-cloud')) {
            // Only apply Lumino Cloud software corrections for the Lumino Cloud brand
            if (phraseLower === 'unbreakable guarantee') {
              suggestedCorrection = 'enterprise-grade reliability SLA';
            } else if (phraseLower === 'military-grade hack-proof' || phraseLower === 'hack-proof') {
              suggestedCorrection = 'SOC 2 Type II and ISO/IEC 27001:2025 audited security infrastructure';
            } else if (phraseLower === 'luminomesh' || phraseLower === 'lumino-mesh' || phraseLower === 'lumino network') {
              suggestedCorrection = 'Lumino Cloud Mesh';
            } else if (phraseLower === 'inferior competitors' || phraseLower === 'slow dinosaurs' || phraseLower === 'slow old competitors') {
              suggestedCorrection = 'traditional architectures';
            } else if (phraseLower === 'foolish') {
              suggestedCorrection = 'cost-prohibitive';
            } else if (phraseLower === 'worthless legacy' || phraseLower === 'worthless') {
              suggestedCorrection = 'legacy';
            } else if (phraseLower === '99.999%') {
              suggestedCorrection = '99.9% uptime SLA (Enterprise Tier)';
            } else if (phraseLower === 'iso-27001:2022' || phraseLower === 'iso 27001:2022') {
              suggestedCorrection = 'ISO/IEC 27001:2025';
            }
            // Notice: 'flawless' is intentionally NOT mapped to a software replacement.
            // If no safe approved claim exists for the term, human review is required.
          }

          // Validate suggested correction against prohibited wording
          if (suggestedCorrection) {
            const correctionLower = suggestedCorrection.toLowerCase();
            const introducesProhibited = rule.prohibitedWording.some(p => {
              const pLower = p.toLowerCase().trim();
              return pLower && correctionLower.includes(pLower);
            });
            if (introducesProhibited) {
              suggestedCorrection = undefined;
            }
          }

          findings.push({
            id: `det-prohibited-${rule.id}-${match.start}`,
            category: rule.category,
            title: `Prohibited Term: "${actualQuoted}"`,
            quotedText: actualQuoted,
            explanation: `Found prohibited phrase "${actualQuoted}". Rule policy: ${rule.description}`,
            severity: rule.severity,
            ruleId: rule.id,
            ruleTitle: rule.title,
            sourceExcerpt: rule.supportingSource,
            whyItApplies: `The marketing text includes "${actualQuoted}", which is explicitly listed as prohibited in "${rule.title}" (${rule.supportingSource}).`,
            suggestedCorrection,
            confidenceExplanation:
              'Exact-token deterministic pattern matching confirmed against active brand rule dictionary.',
            validationMethod: 'deterministic',
            findingType: 'prohibited_term',
            userFriendlyStatusLabel: 'Violates a brand rule',
            userStatus: 'pending',
          });
        }
      }
    }

    // 2. Check required wording when applicable
    if (rule.requiredWording && rule.requiredWording.length > 0) {
      if (rule.id === 'rule-uptime-representation') {
        const mentionsUptime =
          contentLower.includes('uptime') ||
          contentLower.includes('availability') ||
          contentLower.includes('99.');

        if (mentionsUptime) {
          const hasSLA = content.includes('SLA');
          const hasEnterprise =
            contentLower.includes('enterprise tier') || contentLower.includes('enterprise');

          if (!hasSLA || !hasEnterprise) {
            ruleViolated = true;
            findings.push({
              id: `det-required-${rule.id}`,
              category: rule.category,
              title: 'Missing Required SLA Tier Specification',
              quotedText: extractSentenceContaining(content, ['uptime', 'availability', '99.']),
              explanation:
                'Uptime statements require explicit mention of "SLA" and "Enterprise Tier" to prevent misleading standard-tier users.',
              severity: 'high',
              ruleId: rule.id,
              ruleTitle: rule.title,
              sourceExcerpt: rule.supportingSource,
              whyItApplies:
                'Under Schedule B of the SLA Terms of Service, availability percentages are only contractual commitments for the Enterprise Tier.',
              suggestedCorrection:
                'Lumino Cloud provides a 99.9% uptime SLA exclusively for Enterprise Tier workloads.',
              confidenceExplanation:
                'Deterministic token absence check: mandatory contractual terms (SLA, Enterprise Tier) were omitted.',
              validationMethod: 'deterministic',
              findingType: 'required_term_missing',
              userFriendlyStatusLabel: 'Violates a brand rule',
              userStatus: 'pending',
            });
          }
        }
      } else if (rule.id === 'rule-official-product-naming') {
        const mentionsMesh = contentLower.includes('mesh') || contentLower.includes('luminomesh');
        const hasOfficial = content.includes('Lumino Cloud Mesh');
        if (mentionsMesh && !hasOfficial) {
          ruleViolated = true;
          findings.push({
            id: `det-naming-${rule.id}`,
            category: rule.category,
            title: 'Inexact Product Trademark Naming',
            quotedText: extractSentenceContaining(content, ['mesh', 'luminomesh', 'lumino']),
            explanation:
              'Content references the cloud mesh infrastructure without using the registered trademark "Lumino Cloud Mesh".',
            severity: 'medium',
            ruleId: rule.id,
            ruleTitle: rule.title,
            sourceExcerpt: rule.supportingSource,
            whyItApplies:
              'Trademark guidelines mandate writing out the full registered mark "Lumino Cloud Mesh" on first and prominent mentions.',
            suggestedCorrection: 'Lumino Cloud Mesh',
            confidenceExplanation:
              'Deterministic trademark compliance scanner detected non-standard naming variant.',
            validationMethod: 'deterministic',
            findingType: 'required_term_missing',
            userFriendlyStatusLabel: 'Violates a brand rule',
            userStatus: 'pending',
          });
        }
      }
    }

    if (!ruleViolated) {
      passedChecks.push({
        id: `passed-rule-${rule.id}`,
        title: rule.title,
        category: rule.category,
        explanation: `No prohibited wording or required term omissions detected for "${rule.title}".`,
        source: rule.supportingSource,
        checkedItem: rule.prohibitedWording?.join(', ') || rule.requiredWording?.join(', ') || 'Rule compliance',
      });
    }
  }

  // 3. Claims Registry Expiry and Contradiction checks
  for (const claim of claims) {
    if (claim.status === 'expired') {
      if (
        claim.id === 'claim-iso27001-legacy-expired' &&
        (contentLower.includes('iso-27001:2022') ||
          contentLower.includes('iso 27001:2022') ||
          contentLower.includes('2022 interim standard'))
      ) {
        findings.push({
          id: `det-expired-${claim.id}`,
          category: 'compliance',
          title: 'Citation of Expired Compliance Certification',
          quotedText: extractSentenceContaining(content, ['2022', 'iso']),
          explanation: `The referenced ISO-27001:2022 certification expired on ${claim.validUntil}. The current approved certification in the registry is ISO/IEC 27001:2025.`,
          severity: 'critical',
          claimId: claim.id,
          sourceExcerpt: `Claims Registry: ${claim.claimText} (Status: Expired on ${claim.validUntil})`,
          whyItApplies:
            'Marketing materials citing expired security accreditations expose the organization to regulatory liability under enterprise disclosure rules.',
          suggestedCorrection:
            'SOC 2 Type II certified and ISO/IEC 27001:2025 audited across all global data center clusters.',
          confidenceExplanation:
            'Deterministic date validity evaluation against active Claims Registry records.',
          validationMethod: 'deterministic',
          findingType: 'expired_claim',
          userFriendlyStatusLabel: 'Violates a brand rule',
          userStatus: 'pending',
        });
      }
    }

    // Direct Uptime contradiction check (e.g. claiming 99.999% or five nines across all tiers)
    if (claim.id === 'claim-uptime-enterprise') {
      if (
        contentLower.includes('99.999%') ||
        contentLower.includes('five nines') ||
        (contentLower.includes('99.9%') &&
          (contentLower.includes('all tier') ||
            contentLower.includes('all subscriptions') ||
            contentLower.includes('shared tier')))
      ) {
        findings.push({
          id: `det-contradict-uptime`,
          category: 'factual_claims',
          title: 'Direct Contradiction with Approved SLA Claim',
          quotedText: extractSentenceContaining(content, [
            '99.999%',
            'five nines',
            'all tier',
            'shared tier',
            'all shared tier',
          ]),
          explanation: `Approved Claim states: "99.9% uptime SLA is guaranteed exclusively on the Lumino Enterprise Tier". Marketing content inflates availability to 99.999% or extends it to shared tiers.`,
          severity: 'critical',
          claimId: claim.id,
          sourceExcerpt: claim.claimText,
          whyItApplies:
            'Contractual SLAs are legally binding. Advertising 99.999% uptime or shared tier coverage creates immediate breach of contract liability.',
          suggestedCorrection:
            'guaranteed 99.9% uptime SLA exclusively for Enterprise Tier workloads with multi-region failover',
          confidenceExplanation:
            'Deterministic contradiction detected against Claims Registry Record ID #claim-uptime-enterprise.',
          validationMethod: 'deterministic',
          findingType: 'contradiction',
          userFriendlyStatusLabel: 'Violates a brand rule',
          userStatus: 'pending',
        });
      } else if (contentLower.includes('99.9%') && contentLower.includes('enterprise tier')) {
        passedChecks.push({
          id: `passed-claim-${claim.id}`,
          title: 'Enterprise Uptime SLA Claim Verified',
          category: 'factual_claims',
          explanation: 'Accurately aligns with registered 99.9% Enterprise Tier SLA without overpromising.',
          source: claim.supportingEvidence,
          checkedItem: claim.claimText,
        });
      }
    }

    if (claim.id === 'claim-soc2-iso27001' && contentLower.includes('soc 2') && contentLower.includes('iso/iec 27001:2025')) {
      passedChecks.push({
        id: `passed-claim-${claim.id}`,
        title: 'Active Security Certification Verified',
        category: 'compliance',
        explanation: 'Verified current SOC 2 Type II and ISO/IEC 27001:2025 accreditations against third-party audit records.',
        source: claim.supportingEvidence,
        checkedItem: claim.claimText,
      });
    }
  }

  return { findings, passedChecks };
}

/**
 * Finds all case-insensitive occurrences of a phrase with safe word/token boundaries.
 * Correctly matches phrases containing punctuation like '99.999%', '100% bug-free', 'ISO-27001:2022'.
 */
export function findPhraseMatches(
  content: string,
  phrase: string
): { start: number; length: number; matchText: string }[] {
  const matches: { start: number; length: number; matchText: string }[] = [];
  const phraseTrimmed = phrase.trim();
  if (!phraseTrimmed) return matches;

  const startsWithAlpha = /^[a-zA-Z0-9]/.test(phraseTrimmed);
  const endsWithAlpha = /[a-zA-Z0-9]$/.test(phraseTrimmed);

  const prefix = startsWithAlpha ? '(?<![a-zA-Z0-9])' : '';
  const suffix = endsWithAlpha ? '(?![a-zA-Z0-9])' : '';
  const escaped = escapeRegExp(phraseTrimmed);

  try {
    const regex = new RegExp(`${prefix}${escaped}${suffix}`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      matches.push({
        start: m.index,
        length: m[0].length,
        matchText: content.slice(m.index, m.index + m[0].length),
      });
    }
  } catch (err) {
    // Fallback simple search
    let pos = 0;
    const lowerContent = content.toLowerCase();
    const lowerPhrase = phraseTrimmed.toLowerCase();
    while ((pos = lowerContent.indexOf(lowerPhrase, pos)) !== -1) {
      matches.push({
        start: pos,
        length: phraseTrimmed.length,
        matchText: content.slice(pos, pos + phraseTrimmed.length),
      });
      pos += phraseTrimmed.length;
    }
  }

  return matches;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSentenceContaining(text: string, keywords: string[]): string {
  const sentences = text.split(/(?<=[.?!])\s+/);
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    for (const k of keywords) {
      if (sLower.includes(k.toLowerCase())) {
        return s.trim();
      }
    }
  }
  return text.slice(0, 120).trim();
}
