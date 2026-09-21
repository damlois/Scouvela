import { log } from 'apify';
import {
  fundingOpportunitySchema,
  vendorSchema,
  type FundingOpportunity,
  type ParsedActorInput,
  type Vendor,
} from '@scouvela/shared';
import type { RawFundingRecord } from './sources/funding/boi-funding-source.js';
import type { RawVendorRecord } from './sources/vendors/finelib-vendor-source.js';
import { transformFundingRecords } from './transformers/funding-transformer.js';
import { transformVendorRecords } from './transformers/vendor-transformer.js';
import { deduplicateByKey, fundingDedupeKey, vendorDedupeKey } from './utils/deduplicate.js';
import type { RunStats } from './utils/stats.js';

function logInvalid(kind: 'funding' | 'vendor', sourceUrl: string | undefined, label: string | undefined): void {
  log.warning(`Skipped invalid ${kind} record`, {
    sourceUrl,
    label,
  });
}

export function finaliseFundingRecords(
  rawRecords: RawFundingRecord[],
  input: ParsedActorInput,
  discoveredAt: string,
  stats: RunStats,
): FundingOpportunity[] {
  const transformed = transformFundingRecords(rawRecords, input, discoveredAt);
  const { unique, duplicatesRemoved } = deduplicateByKey(transformed, fundingDedupeKey);
  stats.duplicatesRemoved += duplicatesRemoved;

  const validated: FundingOpportunity[] = [];
  for (const record of unique) {
    const parsed = fundingOpportunitySchema.safeParse(record);
    if (!parsed.success) {
      stats.invalidRecordsSkipped += 1;
      logInvalid('funding', record.sourceUrl, record.title);
      continue;
    }

    validated.push(parsed.data);
    if (validated.length >= input.maxResults) {
      break;
    }
  }

  return validated;
}

export function finaliseVendorRecords(
  rawRecords: RawVendorRecord[],
  input: ParsedActorInput,
  discoveredAt: string,
  stats: RunStats,
): Vendor[] {
  const transformed = transformVendorRecords(rawRecords, input, discoveredAt);
  const { unique, duplicatesRemoved } = deduplicateByKey(transformed, vendorDedupeKey);
  stats.duplicatesRemoved += duplicatesRemoved;

  const validated: Vendor[] = [];
  for (const record of unique) {
    const parsed = vendorSchema.safeParse(record);
    if (!parsed.success) {
      stats.invalidRecordsSkipped += 1;
      logInvalid('vendor', record.sourceUrl, record.name);
      continue;
    }

    validated.push(parsed.data);
    if (validated.length >= input.maxResults) {
      break;
    }
  }

  return validated;
}
