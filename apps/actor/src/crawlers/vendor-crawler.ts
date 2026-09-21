import type { ParsedActorInput } from '@scouvela/shared';
import { finelibVendorSource, type RawVendorRecord } from '../sources/vendors/finelib-vendor-source.js';
import type { RunStats } from '../utils/stats.js';
import { crawlSource } from './cheerio-runner.js';

export async function runVendorCrawler(
  input: ParsedActorInput,
  stats: RunStats,
): Promise<RawVendorRecord[]> {
  return crawlSource({
    adapter: finelibVendorSource,
    input,
    stats,
    requireIndexLinks: true,
  });
}
