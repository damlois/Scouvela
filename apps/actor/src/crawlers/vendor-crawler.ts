import { CheerioCrawler, log } from 'crawlee';
import type { ParsedActorInput } from '@scouvela/shared';
import type { RawVendorRecord } from '../transformers/vendor-transformer.js';

/**
 * Vendor crawler scaffolding.
 *
 * TODO: Add only approved public directories and business listings.
 * Do not scrape private profiles, gated listings, or arbitrary websites.
 */
export async function runVendorCrawler(input: ParsedActorInput): Promise<RawVendorRecord[]> {
  const records: RawVendorRecord[] = [];

  // TODO: Replace with approved public vendor-directory URLs.
  const startUrls: { url: string; userData?: { sourceName?: string } }[] = [];

  if (startUrls.length === 0) {
    log.warning('No approved vendor sources configured yet. Skipping vendor crawl.', {
      mode: input.mode,
      query: input.query,
      serviceCategory: input.serviceCategory,
      state: input.state,
    });
    return records;
  }

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: input.maxResults,
    async requestHandler({ request, log: requestLog }) {
      // TODO: Add source-specific Cheerio selectors for this approved URL.
      requestLog.info(`Visited vendor source ${request.url}. Extractors are not configured yet.`);
    },
  });

  await crawler.run(startUrls);
  return records;
}
