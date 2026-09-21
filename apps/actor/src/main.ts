import { Actor, log } from 'apify';
import { actorInputSchema } from '@scouvela/shared';
import { runFundingCrawler } from './crawlers/funding-crawler.js';
import { runVendorCrawler } from './crawlers/vendor-crawler.js';
import { finaliseFundingRecords, finaliseVendorRecords } from './pipeline.js';
import { boiFundingSource } from './sources/funding/boi-funding-source.js';
import { finelibVendorSource } from './sources/vendors/finelib-vendor-source.js';
import { toIsoDate } from './utils/dates.js';
import { ActorInputError } from './utils/errors.js';
import { createRunStats, formatRunSummary } from './utils/stats.js';

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown Actor error';
}

function formatInputError(issues: Array<{ path: PropertyKey[]; message: string }>): string {
  return issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : 'input'}: ${issue.message}`)
    .join('; ');
}

await Actor.init();

let exitCode = 0;

try {
  const rawInput = await Actor.getInput<unknown>();
  const parsedInput = actorInputSchema.safeParse(rawInput ?? {});

  if (!parsedInput.success) {
    throw new ActorInputError(`Invalid Actor input: ${formatInputError(parsedInput.error.issues)}`);
  }

  const input = parsedInput.data;
  const discoveredAt = toIsoDate();

  if (input.mode === 'funding') {
    const stats = createRunStats(input.mode, boiFundingSource.sourceName);
    log.info('Starting Scouvela funding crawl', {
      source: stats.sourceName,
      maxResults: input.maxResults,
      hasQuery: Boolean(input.query),
    });

    const rawRecords = await runFundingCrawler(input, stats);
    const validated = finaliseFundingRecords(rawRecords, input, discoveredAt, stats);

    for (const item of validated) {
      await Actor.pushData(item);
    }

    stats.recordsSaved = validated.length;
    log.info('Funding crawl complete', formatRunSummary(stats));
  } else {
    const stats = createRunStats(input.mode, finelibVendorSource.sourceName);
    log.info('Starting Scouvela vendor crawl', {
      source: stats.sourceName,
      maxResults: input.maxResults,
      serviceCategory: input.serviceCategory,
      state: input.state,
    });

    const rawRecords = await runVendorCrawler(input, stats);
    const validated = finaliseVendorRecords(rawRecords, input, discoveredAt, stats);

    for (const item of validated) {
      await Actor.pushData(item);
    }

    stats.recordsSaved = validated.length;
    log.info('Vendor crawl complete', formatRunSummary(stats));
  }
} catch (error) {
  exitCode = 1;
  log.error('Scouvela Actor failed', { message: publicErrorMessage(error) });
} finally {
  await Actor.exit({ exitCode });
}
