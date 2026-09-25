import { log } from 'apify';
import { smeOpportunitySchema, type ParsedActorInput, type SmeOpportunity } from '@scouvela/shared';
import { matchesRawOpportunity, matchesSavedOpportunity } from './input/filters.js';
import type { RawOpportunity } from './sources/types.js';
import { opportunityDedupeKey, transformOpportunity } from './transformers/opportunity-transformer.js';
import { dedupeOpportunities } from './utils/opportunity-dedupe.js';
import { deduplicateByKey } from './utils/deduplicate.js';
import type { RunStats } from './utils/stats.js';

export function finaliseOpportunities(
  rawRecords: RawOpportunity[],
  input: ParsedActorInput,
  scrapedAt: string,
  stats: RunStats,
): SmeOpportunity[] {
  const transformed: SmeOpportunity[] = [];

  for (const record of rawRecords) {
    const item = transformOpportunity(record, scrapedAt);
    if (!item) {
      stats.invalidRecordsSkipped += 1;
      log.warning('Skipped invalid opportunity', {
        sourceUrl: record.sourceUrl,
        title: record.title,
      });
      continue;
    }

    stats.recordsNormalized += 1;
    transformed.push(item);
  }

  const { unique: urlUnique, duplicatesRemoved } = deduplicateByKey(transformed, (item) =>
    opportunityDedupeKey({
      provider: item.provider,
      title: item.title,
      sourceUrl: item.sourceUrl,
    }),
  );
  const { unique, duplicatesRemoved: crossSourceDuplicates } = dedupeOpportunities(urlUnique);
  stats.duplicatesRemoved += duplicatesRemoved + crossSourceDuplicates;

  const validated: SmeOpportunity[] = [];
  for (const record of unique) {
    const parsed = smeOpportunitySchema.safeParse(record);
    if (!parsed.success) {
      stats.invalidRecordsSkipped += 1;
      log.warning('Skipped opportunity that failed schema validation', {
        sourceUrl: record.sourceUrl,
        title: record.title,
      });
      continue;
    }

    if (!matchesRawOpportunity(parsed.data, input)) {
      stats.recordsFilteredByInput += 1;
      continue;
    }

    if (!input.includeExpired && parsed.data.status === 'expired') {
      stats.recordsFilteredExpired += 1;
      continue;
    }

    if (!matchesSavedOpportunity(parsed.data, { ...input, includeExpired: true })) {
      stats.recordsFilteredByInput += 1;
      continue;
    }

    validated.push(parsed.data);
    if (parsed.data.sourcePlatform === 'instagram' && parsed.data.verification.status === 'incomplete') {
      stats.incompleteSocialRecordsSaved += 1;
    }
    if (validated.length >= input.maxResults) {
      break;
    }
  }

  return validated;
}
