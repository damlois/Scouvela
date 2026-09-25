import { log } from 'apify';
import { smeOpportunitySchema, type ParsedActorInput, type SmeOpportunity } from '@scouvela/shared';
import { matchesSavedOpportunity } from './input/filters.js';
import type { RawOpportunity } from './sources/types.js';
import { opportunityDedupeKey, transformOpportunity } from './transformers/opportunity-transformer.js';
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

    transformed.push(item);
  }

  const { unique, duplicatesRemoved } = deduplicateByKey(transformed, (item) =>
    opportunityDedupeKey({
      provider: item.provider,
      title: item.title,
      sourceUrl: item.sourceUrl,
    }),
  );
  stats.duplicatesRemoved += duplicatesRemoved;

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

    if (!matchesSavedOpportunity(parsed.data, input)) {
      continue;
    }

    validated.push(parsed.data);
    if (validated.length >= input.maxResults) {
      break;
    }
  }

  return validated;
}
