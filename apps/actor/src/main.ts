import { Actor, log } from 'apify';
import {
  actorInputSchema,
  fundingOpportunitySchema,
  vendorSchema,
  type FundingOpportunity,
  type Vendor,
} from '@scouvela/shared';
import { runFundingCrawler } from './crawlers/funding-crawler.js';
import { runVendorCrawler } from './crawlers/vendor-crawler.js';
import { transformFundingRecords } from './transformers/funding-transformer.js';
import { transformVendorRecords } from './transformers/vendor-transformer.js';
import { toIsoDate } from './utils/dates.js';
import { deduplicateByKey, fundingDedupeKey, vendorDedupeKey } from './utils/deduplicate.js';

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown Actor error';
}

await Actor.init();

try {
  const rawInput = await Actor.getInput<unknown>();
  const parsedInput = actorInputSchema.safeParse(rawInput ?? {});

  if (!parsedInput.success) {
    const message = `Invalid Actor input: ${parsedInput.error.issues.map((issue) => issue.message).join('; ')}`;
    log.error(message);
    throw new Error(message);
  }

  const input = parsedInput.data;
  log.info('Starting Scouvela discovery Actor', {
    mode: input.mode,
    maxResults: input.maxResults,
    state: input.state,
    hasQuery: Boolean(input.query),
  });

  const discoveredAt = toIsoDate();

  if (input.mode === 'funding') {
    const rawRecords = await runFundingCrawler(input);
    const transformed = transformFundingRecords(rawRecords, input, discoveredAt);
    const unique = deduplicateByKey(transformed, fundingDedupeKey);
    const validated: FundingOpportunity[] = [];

    for (const record of unique) {
      const parsed = fundingOpportunitySchema.safeParse(record);
      if (!parsed.success) {
        log.warning('Dropped invalid funding record', {
          title: record.title,
          sourceUrl: record.sourceUrl,
        });
        continue;
      }

      validated.push(parsed.data);
      if (validated.length >= input.maxResults) {
        break;
      }
    }

    await Actor.pushData(validated);
    log.info(`Pushed ${validated.length} funding records to the default dataset.`);
  } else {
    const rawRecords = await runVendorCrawler(input);
    const transformed = transformVendorRecords(rawRecords, input, discoveredAt);
    const unique = deduplicateByKey(transformed, vendorDedupeKey);
    const validated: Vendor[] = [];

    for (const record of unique) {
      const parsed = vendorSchema.safeParse(record);
      if (!parsed.success) {
        log.warning('Dropped invalid vendor record', {
          name: record.name,
          sourceUrl: record.sourceUrl,
        });
        continue;
      }

      validated.push(parsed.data);
      if (validated.length >= input.maxResults) {
        break;
      }
    }

    await Actor.pushData(validated);
    log.info(`Pushed ${validated.length} vendor records to the default dataset.`);
  }
} catch (error) {
  log.error('Scouvela Actor failed', { message: publicErrorMessage(error) });
  throw error;
} finally {
  await Actor.exit();
}
