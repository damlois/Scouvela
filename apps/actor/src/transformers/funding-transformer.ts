import type { FundingOpportunity, ParsedActorInput } from '@scouvela/shared';
import { calculateFundingStatus, toIsoDate } from '../utils/dates.js';
import { formatLocation } from '../utils/locations.js';

export type RawFundingRecord = {
  id?: string;
  title?: string;
  provider?: string;
  fundingType?: FundingOpportunity['fundingType'];
  amount?: string;
  eligibility?: string[];
  deadline?: string;
  location?: string;
  state?: string;
  locality?: string;
  description?: string;
  sourceUrl?: string;
  sourceName?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function transformFundingRecords(
  records: RawFundingRecord[],
  input: ParsedActorInput,
  discoveredAt: string = toIsoDate(),
): FundingOpportunity[] {
  const transformed: FundingOpportunity[] = [];

  for (const record of records) {
    if (!record.title || !record.provider || !record.sourceUrl || !record.sourceName) {
      continue;
    }

    const location = record.location ?? formatLocation(record.state ?? input.state, record.locality ?? input.locality);

    transformed.push({
      id: record.id ?? `funding-${slugify(`${record.provider}-${record.title}`)}`,
      title: record.title,
      provider: record.provider,
      fundingType: record.fundingType ?? input.fundingType ?? 'support-programme',
      amount: record.amount,
      eligibility: record.eligibility,
      deadline: record.deadline,
      status: calculateFundingStatus(record.deadline),
      location,
      description: record.description,
      sourceUrl: record.sourceUrl,
      sourceName: record.sourceName,
      discoveredAt,
    });
  }

  return transformed;
}
