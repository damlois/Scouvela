import type { OpportunityConfidence, SmeOpportunity } from '@scouvela/shared';
import type { RawOpportunity } from '../sources/types.js';
import { calculateOpportunityStatus, normalizeDeadline, toIsoDate } from '../utils/dates.js';
import { deterministicId } from '../utils/ids.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { canonicalizeUrl, toAbsoluteUrl } from '../utils/urls.js';
import { verifyOpportunity } from '../verification/opportunity-verifier.js';

function toOptional(value: string | undefined): string | undefined {
  return emptyToUndefined(value);
}

function confidenceFor(record: {
  description?: string;
  deadline?: string;
  applicationUrl?: string;
  eligibility?: string[];
  opportunityType?: string;
}): OpportunityConfidence {
  const hasDeadlineOrApply = Boolean(record.deadline || record.applicationUrl);
  const hasEligibility = Boolean(record.eligibility && record.eligibility.length > 0);
  const hasDescription = Boolean(record.description && record.description.length > 80);

  if (hasDescription && hasDeadlineOrApply && hasEligibility && record.opportunityType) {
    return 'high';
  }

  if (hasDescription && record.opportunityType) {
    return 'medium';
  }

  return 'low';
}

export function transformOpportunity(
  record: RawOpportunity,
  scrapedAt: string = toIsoDate(),
): SmeOpportunity | null {
  const title = toOptional(record.title);
  const provider = toOptional(record.provider);
  const description = toOptional(record.description);
  const sourceName = toOptional(record.sourceName);
  const sourceUrl = record.sourceUrl ? toAbsoluteUrl(record.sourceUrl, record.sourceUrl) : undefined;
  const countries = uniqueNonEmpty(record.countries ?? []);

  if (!title || !provider || !description || !sourceName || !sourceUrl || !countries) {
    return null;
  }

  const deadline = normalizeDeadline(record.deadline);
  const applicationUrl = record.applicationUrl
    ? toAbsoluteUrl(record.applicationUrl, sourceUrl)
    : undefined;
  const sourcePlatform = record.sourcePlatform ?? 'website';
  const curatedSource =
    record.curatedSource ?? (sourcePlatform === 'website' && !record.originalContentUrl);
  const reviewedProviderDomain = record.reviewedProviderDomain === true || curatedSource;
  const canonicalSource = canonicalizeUrl(sourceUrl);
  const verification = verifyOpportunity({
    applicationUrl,
    applicationProcess: record.applicationProcess,
    deadline,
    provider,
    eligibilityCount: record.eligibility?.length ?? 0,
    benefitsCount: record.benefits?.length ?? 0,
    accountName: record.accountName,
    accountHandle: record.accountHandle,
    text: description,
    curatedWebsite: curatedSource,
    reviewedProviderDomain,
    applicationPageConfirmed: record.applicationPageConfirmed === true,
  });
  if (record.possibleRepost) {
    verification.warnings = uniqueNonEmpty([
      ...verification.warnings,
      'The text may be a repost or a share of someone else’s announcement.',
    ]) ?? verification.warnings;
  }
  verification.warnings = uniqueNonEmpty([
    ...verification.warnings,
    ...(record.extractionWarnings ?? []),
  ]) ?? [];

  return {
    id: deterministicId('opportunity', [provider, title, canonicalSource]),
    title,
    provider,
    providerType: record.providerType,
    opportunityType: record.opportunityType ?? 'other',
    description,
    countries,
    regions: uniqueNonEmpty(record.regions ?? []),
    sectors: uniqueNonEmpty(record.sectors ?? []),
    targetGroups: record.targetGroups,
    businessStages: record.businessStages,
    benefits: uniqueNonEmpty(record.benefits ?? []),
    fundingAmount: record.fundingAmountText
      ? { displayText: record.fundingAmountText }
      : undefined,
    eligibility: uniqueNonEmpty(record.eligibility ?? []),
    applicationProcess: toOptional(record.applicationProcess),
    applicationUrl,
    sourceUrl: canonicalSource,
    sourceName,
    sourcePlatform,
    contentType: record.contentType ?? (sourcePlatform === 'website' ? 'webpage' : undefined),
    originalContentUrl: record.originalContentUrl ? canonicalizeUrl(record.originalContentUrl) : undefined,
    discoveredFrom: uniqueNonEmpty([...(record.discoveredFrom ?? []), canonicalSource]),
    publishedAt: toOptional(record.publishedAt),
    deadline,
    deadlineText: toOptional(record.deadlineText),
    status: calculateOpportunityStatus(deadline ?? record.deadline, new Date(), {
      applicationsOpen: record.applicationsOpen === true,
      ongoing: record.ongoing === true,
    }),
    isRemote: record.isRemote,
    language: record.language ?? 'English',
    scrapedAt,
    confidence: confidenceFor({
      description,
      deadline,
      applicationUrl,
      eligibility: record.eligibility,
      opportunityType: record.opportunityType,
    }),
    verification,
    ai: null,
  };
}

export function opportunityDedupeKey(item: {
  provider: string;
  title: string;
  sourceUrl: string;
}): string {
  return `${item.provider}::${item.title}::${item.sourceUrl}`.toLowerCase();
}
