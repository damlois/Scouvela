import { CheerioCrawler, log } from 'crawlee';
import type { ParsedActorInput } from '@scouvela/shared';
import type { RawFundingRecord } from '../transformers/funding-transformer.js';

/**
 * Funding crawler scaffolding.
 *
 * TODO: Add only approved public sources (government agencies, development
 * banks, and programme pages that allow public reuse). Do not scrape arbitrary
 * websites or guess CSS selectors.
 */
export async function runFundingCrawler(input: ParsedActorInput): Promise<RawFundingRecord[]> {
  const records: RawFundingRecord[] = [];

  // TODO: Replace with approved public funding-source URLs.
  const startUrls: { url: string; userData?: { sourceName?: string } }[] = [];

  if (startUrls.length === 0) {
    log.warning('No approved funding sources configured yet. Skipping funding crawl.', {
      mode: input.mode,
      query: input.query,
      state: input.state,
    });
    return records;
  }

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: input.maxResults,
    async requestHandler({ request, log: requestLog }) {
      // TODO: Add source-specific Cheerio selectors for this approved URL.
      requestLog.info(`Visited funding source ${request.url}. Extractors are not configured yet.`);
    },
  });

  await crawler.run(startUrls);
  return records;
}
