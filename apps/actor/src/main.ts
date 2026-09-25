import { Actor, log } from 'apify';
import { actorInputSchema } from '@scouvela/shared';
import { applyAiSearchPlan, enrichOpportunities, writeOpportunityReport } from './ai/agent.js';
import { crawlSelectedSources } from './crawlers/opportunity-crawler.js';
import { planSearchFromQuery } from './input/planner.js';
import { finaliseOpportunities } from './pipeline.js';
import { toIsoDate } from './utils/dates.js';
import { ActorInputError } from './utils/errors.js';
import { createRunStats, formatRunSummary } from './utils/stats.js';

function publicErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]');
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

  const stats = createRunStats();
  const scrapedAt = toIsoDate();
  const planned = planSearchFromQuery(parsedInput.data);
  const input = await applyAiSearchPlan(planned, stats);

  log.info('Starting Scouvela African SME opportunity crawl', {
    countries: input.countries,
    opportunityTypes: input.opportunityTypes ?? [],
    maxResults: input.maxResults,
    aiEnabled: input.ai.enabled,
  });

  const rawRecords = await crawlSelectedSources(input, stats);
  const validated = finaliseOpportunities(rawRecords, input, scrapedAt, stats);
  const output = await enrichOpportunities(validated, input, stats);

  for (const item of output) {
    await Actor.pushData(item);
  }

  stats.recordsSaved = output.length;
  await writeOpportunityReport(output, input, stats);

  if (output.length === 0 && stats.sourcesCompleted.length === 0 && stats.failedSources.length > 0) {
    throw new Error(
      `No opportunities were saved. Failed sources: ${stats.failedSources
        .map((item) => `${item.sourceId}: ${item.message}`)
        .join('; ')}`,
    );
  }

  log.info('Opportunity crawl complete', formatRunSummary(stats));
} catch (error) {
  exitCode = 1;
  log.error('Scouvela Actor failed', { message: publicErrorMessage(error) });
} finally {
  await Actor.exit({ exitCode });
}
