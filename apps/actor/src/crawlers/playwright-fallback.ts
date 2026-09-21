import { log } from 'crawlee';

/**
 * Optional Playwright fallback for approved sources that cannot be parsed with Cheerio.
 *
 * TODO: Enable only after a source is approved and confirmed to require a real browser.
 * Do not point this crawler at arbitrary websites or invent selectors.
 */
export async function runPlaywrightFallbackCrawler(
  startUrls: { url: string }[] = [],
): Promise<unknown[]> {
  if (startUrls.length === 0) {
    log.info('Playwright fallback was not used because no approved JavaScript-rendered sources are configured.');
    return [];
  }

  const { PlaywrightCrawler } = await import('crawlee');

  const records: unknown[] = [];
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: startUrls.length,
    async requestHandler({ request, page, log: requestLog }) {
      // TODO: Add source-specific Playwright locators for this approved URL.
      await page.waitForLoadState('domcontentloaded');
      requestLog.info(`Visited JS-rendered source ${request.url}. Extractors are not configured yet.`);
    },
  });

  await crawler.run(startUrls);
  return records;
}
