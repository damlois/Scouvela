import { log } from 'apify';
import type { ParsedActorInput } from '@scouvela/shared';
import { selectSources } from '../sources/registry.js';
import type { RawOpportunity, SourceAdapter } from '../sources/types.js';
import type { RunStats } from '../utils/stats.js';
import { crawlSource } from './cheerio-runner.js';

export async function crawlSelectedSources(
  input: ParsedActorInput,
  stats: RunStats,
): Promise<RawOpportunity[]> {
  const sources = selectSources(input);
  stats.sourcesAttempted = sources.map((source) => source.sourceId);

  if (sources.length === 0) {
    log.warning('No sources matched the requested countries or opportunity types');
    return [];
  }

  const collected: RawOpportunity[] = [];

  for (const source of sources) {
    try {
      log.info('Crawling source', {
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        countries: source.countries,
      });
      const records = await crawlSource<RawOpportunity>({
        adapter: source as SourceAdapter<RawOpportunity>,
        input,
        stats,
      });
      collected.push(...records);
      stats.sourcesCompleted.push(source.sourceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source error';
      stats.failedSources.push({ sourceId: source.sourceId, message });
      log.warning('Source failed; continuing with remaining sources', {
        sourceId: source.sourceId,
        message,
      });
    }
  }

  return collected;
}
