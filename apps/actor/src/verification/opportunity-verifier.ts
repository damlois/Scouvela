import type { OpportunityVerification, VerificationStatus } from '@scouvela/shared';

export type VerificationFacts = {
  applicationUrl?: string;
  applicationProcess?: string;
  deadline?: string;
  provider?: string;
  eligibilityCount: number;
  benefitsCount: number;
  accountName?: string;
  accountHandle?: string;
  text?: string;
  curatedWebsite: boolean;
  reviewedProviderDomain?: boolean;
  applicationPageConfirmed: boolean;
};

const STATUS_RANK: Record<VerificationStatus, number> = {
  'verified-application-page': 4,
  'official-source': 3,
  unverified: 2,
  incomplete: 1,
};

export function verificationRank(status: VerificationStatus): number {
  return STATUS_RANK[status];
}

export function verifyOpportunity(facts: VerificationFacts): OpportunityVerification {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const hasApplicationMethod = Boolean(facts.applicationUrl || facts.applicationProcess);
  const possibleRepost = isPossibleRepost(facts.text);
  const accountMatches = accountMatchesProvider(facts.provider, facts.accountName, facts.accountHandle);
  const officialDomain = facts.curatedWebsite || facts.reviewedProviderDomain === true;

  if (facts.applicationUrl) {
    score += 20;
    reasons.push('An application URL is present.');
  }

  if (facts.deadline) {
    score += 15;
    reasons.push('A deadline is stated.');
  }

  if (facts.provider) {
    score += 15;
    reasons.push('A provider name is present.');
  }

  if (facts.eligibilityCount > 0) {
    score += 10;
    reasons.push('Eligibility text is present.');
  }

  if (facts.benefitsCount > 0) {
    score += 10;
    reasons.push('Benefits are stated.');
  }

  if (facts.applicationPageConfirmed) {
    score += 15;
    reasons.push('The application destination was successfully validated.');
  } else if (officialDomain) {
    score += 15;
    reasons.push('The page is on a reviewed official provider domain.');
  } else if (accountMatches && !possibleRepost) {
    score += 10;
    reasons.push('The account name matches the named provider. Instagram verification was not confirmed.');
  }

  if (!hasApplicationMethod) {
    score -= 20;
    warnings.push('No application link or application method was found.');
  }

  if (!officialDomain && !accountMatches) {
    score -= 10;
    warnings.push('Account ownership could not be confirmed.');
  }

  if (possibleRepost) {
    score -= 15;
    warnings.push('The text may be a repost or a share of someone else’s announcement.');
  }

  let status: VerificationStatus = 'unverified';
  if (!hasApplicationMethod) {
    status = 'incomplete';
  } else if (facts.applicationPageConfirmed) {
    status = 'verified-application-page';
  } else if (possibleRepost || (!officialDomain && !accountMatches)) {
    status = 'unverified';
  } else if (officialDomain || accountMatches) {
    status = 'official-source';
    if (facts.applicationUrl && !facts.applicationPageConfirmed) {
      reasons.push(
        'An application URL is listed, but the destination was not separately fetched and validated.',
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push('Not enough public evidence was available to raise the verification score.');
  }

  return {
    status,
    score: clampScore(score),
    reasons: [...new Set(reasons)],
    warnings,
  };
}

export function isPossibleRepost(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  return /\brepost\b|\bshared from\b|\bcredit:\b|\bvia @/i.test(text);
}

function accountMatchesProvider(
  provider: string | undefined,
  accountName: string | undefined,
  accountHandle: string | undefined,
): boolean {
  const providerKey = normalizeIdentity(provider);
  if (!providerKey) {
    return false;
  }

  const nameKey = normalizeIdentity(accountName);
  const handleKey = normalizeIdentity(accountHandle);
  return providerKey === nameKey || providerKey === handleKey || providerKey.replace(/\s+/g, '') === handleKey;
}

function normalizeIdentity(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
