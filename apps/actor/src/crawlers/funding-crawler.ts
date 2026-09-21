import type { ParsedActorInput } from '@scouvela/shared';
import { boiFundingSource, type RawFundingRecord } from '../sources/funding/boi-funding-source.js';
import type { RunStats } from '../utils/stats.js';
import { crawlSource } from './cheerio-runner.js';

export async function runFundingCrawler(
  input: ParsedActorInput,
  stats: RunStats,
): Promise<RawFundingRecord[]> {
  return crawlSource({
    adapter: boiFundingSource,
    input,
    stats,
    requireIndexLinks: true,
  });
}
