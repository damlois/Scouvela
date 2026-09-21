import type { FundingOpportunity, ParsedActorInput } from '@scouvela/shared';
import type { RawFundingRecord } from '../sources/funding/boi-funding-source.js';
import { calculateFundingStatus, normalizeDeadline, toIsoDate } from '../utils/dates.js';
import { deterministicId } from '../utils/ids.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { canonicalizeUrl, toAbsoluteUrl } from '../utils/urls.js';

function toOptional(value: string | undefined): string | undefined {
  return emptyToUndefined(value);
}

export function transformFundingRecord(
  record: RawFundingRecord,
  discoveredAt: string = toIsoDate(),
): FundingOpportunity | null {
  const title = toOptional(record.title);
  const provider = toOptional(record.provider);
  const sourceUrl = record.sourceUrl ? toAbsoluteUrl(record.sourceUrl, record.sourceUrl) : undefined;
  const sourceName = toOptional(record.sourceName);
  const fundingType = record.fundingType;

  if (!title || !provider || !sourceUrl || !sourceName || !fundingType) {
    return null;
  }

  const deadline = normalizeDeadline(record.deadline);
  const eligibility = uniqueNonEmpty(record.eligibility ?? []);

  return {
    id: deterministicId('funding', [provider, title, canonicalizeUrl(sourceUrl)]),
    kind: 'funding',
    title,
    provider,
    fundingType,
    amount: toOptional(record.amount),
    eligibility,
    deadline,
    status: calculateFundingStatus(deadline, new Date(), record.applicationsOpen === true),
    location: toOptional(record.location),
    description: toOptional(record.description),
    sourceUrl: canonicalizeUrl(sourceUrl),
    sourceName,
    discoveredAt,
  };
}

export function transformFundingRecords(
  records: RawFundingRecord[],
  _input: ParsedActorInput,
  discoveredAt: string = toIsoDate(),
): FundingOpportunity[] {
  return records
    .map((record) => transformFundingRecord(record, discoveredAt))
    .filter((record): record is FundingOpportunity => record != null);
}
