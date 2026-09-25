import type { ParsedActorInput } from '@scouvela/shared';
import { boiNigeriaSource } from '../sources/boi-nigeria.js';
import type { RawOpportunity } from '../sources/types.js';
import type { RunStats } from '../utils/stats.js';
import { crawlSource } from './cheerio-runner.js';

export async function runFundingCrawler(
  input: ParsedActorInput,
  stats: RunStats,
): Promise<RawOpportunity[]> {
  return crawlSource({
    adapter: boiNigeriaSource,
    input,
    stats,
    requireIndexLinks: true,
  });
}
