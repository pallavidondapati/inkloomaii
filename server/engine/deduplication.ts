import type { AuditFinding, BrandRule, ApprovedClaim, Brand } from '../../src/types/index.js';
import { findPhraseMatches } from './deterministic.js';

/**
 * Normalizes a quote string by trimming whitespace and punctuation.
 */
function normalizeQuote(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/^["'“”‘’.,!?;:]+|["'“”‘’.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Deduplicates findings across deterministic and AI analyzers.
 * Ensures the same sentence or problematic token is never flagged twice.
 */
export function deduplicateAuditFindings(
  findings: AuditFinding[],
  rules: BrandRule[],
  claims: ApprovedClaim[],
  brand?: Brand
): AuditFinding[] {
  const deduplicated: AuditFinding[] = [];

  for (const candidate of findings) {
    const candidateNorm = normalizeQuote(candidate.quotedText);
    if (!candidateNorm) continue;

    const existingIndex = deduplicated.findIndex((existing) => {
      const existingNorm = normalizeQuote(existing.quotedText);

      // 1. Exact normalized quote match
      if (candidateNorm === existingNorm) {
        return true;
      }

      // 2. Same rule citation with overlapping quotes
      if (
        candidate.ruleId &&
        existing.ruleId &&
        candidate.ruleId === existing.ruleId &&
        (candidateNorm.includes(existingNorm) || existingNorm.includes(candidateNorm))
      ) {
        return true;
      }

      // 3. Significant quote overlap (>= 5 chars) regardless of category
      if (
        (candidateNorm.length >= 5 && existingNorm.includes(candidateNorm)) ||
        (existingNorm.length >= 5 && candidateNorm.includes(existingNorm))
      ) {
        return true;
      }

      return false;
    });

    if (existingIndex === -1) {
      deduplicated.push({ ...candidate });
    } else {
      // Merge duplicate findings:
      // Prefer deterministic finding for exact token match, or whichever has higher severity
      const existing = deduplicated[existingIndex];
      const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const candidateRank = severityRank[candidate.severity] || 1;
      const existingRank = severityRank[existing.severity] || 1;

      // Retain the higher severity finding
      const primary = candidateRank > existingRank ? candidate : existing;
      const secondary = primary === candidate ? existing : candidate;

      // Merge verified rule citations if primary is missing them
      if (!primary.ruleId && secondary.ruleId) {
        primary.ruleId = secondary.ruleId;
        primary.ruleTitle = secondary.ruleTitle;
        primary.sourceExcerpt = secondary.sourceExcerpt;
      }
      if (!primary.suggestedCorrection && secondary.suggestedCorrection) {
        primary.suggestedCorrection = secondary.suggestedCorrection;
      }

      deduplicated[existingIndex] = primary;
    }
  }

  // Sanitize and validate every finding in the deduplicated list
  return sanitizeFindings(deduplicated, rules, claims, brand);
}

/**
 * Validates citations against stored rules, and ensures suggested corrections
 * are supported by brand guidelines and never introduce unapproved benefits or prohibited words.
 */
export function sanitizeFindings(
  findings: AuditFinding[],
  rules: BrandRule[],
  claims: ApprovedClaim[],
  brand?: Brand
): AuditFinding[] {
  const isSoftwareBrand =
    brand?.id === 'brand-lumino-cloud' ||
    (brand?.industry && /cloud|software|devops|saas|it/i.test(brand.industry));

  // Collect all prohibited words across active rules for this brand
  const prohibitedWordingSet: string[] = [];
  for (const r of rules) {
    if (r.isActive !== false && r.prohibitedWording) {
      for (const p of r.prohibitedWording) {
        const pTrim = p.trim().toLowerCase();
        if (pTrim) prohibitedWordingSet.push(pTrim);
      }
    }
  }

  return findings.map((f) => {
    // 1. Citation verification against stored brand rules
    if (f.ruleId) {
      const matchedRule = rules.find((r) => r.id === f.ruleId);
      if (matchedRule) {
        f.ruleTitle = matchedRule.title;
        f.sourceExcerpt = matchedRule.supportingSource;
      } else {
        // Citations to non-existent rules or rules from another brand are removed
        f.ruleId = undefined;
        f.ruleTitle = undefined;
        f.sourceExcerpt = undefined;
      }
    }

    // 2. Citation verification against claims registry
    if (f.claimId) {
      const matchedClaim = claims.find((c) => c.id === f.claimId);
      if (matchedClaim) {
        if (!f.sourceExcerpt) {
          f.sourceExcerpt = matchedClaim.supportingEvidence;
        }
      } else {
        f.claimId = undefined;
      }
    }

    // 3. Correction safety and relevance verification
    if (f.suggestedCorrection) {
      const correctionLower = f.suggestedCorrection.toLowerCase().trim();

      // Check: Does the correction contain any prohibited wording for this brand?
      const introducesProhibited = prohibitedWordingSet.some((pw) => {
        return findPhraseMatches(correctionLower, pw).length > 0;
      });

      if (introducesProhibited) {
        f.suggestedCorrection = undefined;
      }

      // Check: Irrelevant industry terminology check (e.g. software terms on sunscreen)
      if (!isSoftwareBrand && f.suggestedCorrection) {
        const softwareTerms = [
          'fault-tolerant',
          'rigorously tested and fault-tolerant',
          'microvm',
          'sla',
          'uptime',
          'soc 2',
          'devops',
          'bug-free',
        ];
        const hasSoftwareTerm = softwareTerms.some((st) => correctionLower.includes(st));
        if (hasSoftwareTerm) {
          f.suggestedCorrection = undefined;
        }
      }

      // Check: Ensure the correction is actually grounded in an approved claim, required wording, or registered brand standard
      if (f.suggestedCorrection) {
        const hasRuleRequiredWording = rules.some((r) =>
          r.requiredWording?.some((rw) =>
            correctionLower.includes(rw.toLowerCase()) || rw.toLowerCase().includes(correctionLower)
          )
        );

        const hasApprovedClaimSupport = claims.some(
          (c) =>
            c.status === 'approved' &&
            (c.claimText.toLowerCase().includes(correctionLower) ||
              correctionLower.includes(c.claimText.toLowerCase()) ||
              c.supportingEvidence.toLowerCase().includes(correctionLower))
        );

        const isKnownBrandTerm = brand && correctionLower.includes(brand.name.toLowerCase());

        if (!hasRuleRequiredWording && !hasApprovedClaimSupport && !isKnownBrandTerm) {
          // If no safe approved claim or required wording supports this, human review is required
          f.suggestedCorrection = undefined;
        }
      }
    }

    return f;
  });
}
