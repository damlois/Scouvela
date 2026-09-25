import type { SmeOpportunity } from '@scouvela/shared';
import { verificationRank } from '../verification/opportunity-verifier.js';
import { canonicalizeUrl } from './urls.js';
import { emptyToUndefined } from './text.js';

export function dedupeOpportunities(records: SmeOpportunity[]): {
  unique: SmeOpportunity[];
  duplicatesRemoved: number;
} {
  const groups: SmeOpportunity[][] = [];

  for (const record of records) {
    const group = groups.find((items) => items.some((existing) => sameOpportunity(existing, record)));
    if (group) {
      group.push(record);
    } else {
      groups.push([record]);
    }
  }

  let duplicatesRemoved = 0;
  const unique = groups.map((group) => {
    duplicatesRemoved += group.length - 1;
    return group.reduce(mergePair);
  });

  return { unique, duplicatesRemoved };
}

function sameOpportunity(left: SmeOpportunity, right: SmeOpportunity): boolean {
  if (normalize(left.provider) !== normalize(right.provider)) {
    return false;
  }

  if (normalize(left.title) !== normalize(right.title)) {
    return false;
  }

  if (
    left.opportunityType !== right.opportunityType &&
    left.opportunityType !== 'other' &&
    right.opportunityType !== 'other'
  ) {
    return false;
  }

  if (left.applicationUrl && right.applicationUrl && canonical(left.applicationUrl) !== canonical(right.applicationUrl)) {
    return false;
  }

  if (left.deadline && right.deadline && left.deadline !== right.deadline) {
    return false;
  }

  return Boolean(
    (left.applicationUrl && right.applicationUrl) ||
      (left.deadline && right.deadline) ||
      left.opportunityType === right.opportunityType,
  );
}

function mergePair(current: SmeOpportunity, incoming: SmeOpportunity): SmeOpportunity {
  const preferred = prefer(current, incoming);
  const other = preferred === current ? incoming : current;
  const discoveredFrom = uniqueUrls([
    ...(preferred.discoveredFrom ?? []),
    ...(other.discoveredFrom ?? []),
    preferred.sourceUrl,
    other.sourceUrl,
    preferred.originalContentUrl,
    other.originalContentUrl,
  ]);

  return {
    ...other,
    ...preferred,
    applicationUrl: preferred.applicationUrl ?? other.applicationUrl,
    deadline: preferred.deadline ?? other.deadline,
    deadlineText: preferred.deadlineText ?? other.deadlineText,
    eligibility: preferred.eligibility ?? other.eligibility,
    benefits: preferred.benefits ?? other.benefits,
    regions: preferred.regions ?? other.regions,
    sectors: preferred.sectors ?? other.sectors,
    fundingAmount: preferred.fundingAmount ?? other.fundingAmount,
    originalContentUrl: preferred.originalContentUrl ?? other.originalContentUrl,
    discoveredFrom,
    verification: strongerVerification(preferred, other),
    ai: preferred.ai ?? other.ai,
  };
}

function prefer(left: SmeOpportunity, right: SmeOpportunity): SmeOpportunity {
  const leftRank = verificationRank(left.verification.status);
  const rightRank = verificationRank(right.verification.status);
  if (leftRank !== rightRank) {
    return leftRank > rightRank ? left : right;
  }

  if (left.verification.score !== right.verification.score) {
    return left.verification.score > right.verification.score ? left : right;
  }

  if (Boolean(left.applicationUrl) !== Boolean(right.applicationUrl)) {
    return left.applicationUrl ? left : right;
  }

  return left;
}

function strongerVerification(preferred: SmeOpportunity, other: SmeOpportunity): SmeOpportunity['verification'] {
  const chosen = prefer(preferred, other).verification;
  return {
    ...chosen,
    reasons: uniqueText([...chosen.reasons, ...other.verification.reasons]).slice(0, 12),
    warnings: uniqueText([...chosen.warnings, ...other.verification.warnings]).slice(0, 12),
  };
}

function uniqueUrls(values: Array<string | undefined>): string[] | undefined {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) {
      continue;
    }

    const key = canonical(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(key);
  }

  return unique.length > 0 ? unique : undefined;
}

function uniqueText(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(value);
  }

  return unique;
}

function canonical(value: string): string {
  try {
    return canonicalizeUrl(value);
  } catch {
    return value;
  }
}

function normalize(value: string): string {
  return emptyToUndefined(value)?.toLowerCase() ?? '';
}
