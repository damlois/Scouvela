import { CheerioCrawler, log } from 'crawlee';
import type { ParsedActorInput } from '@scouvela/shared';
import {
  CRAWL_HANDLER_TIMEOUT_SECS,
  CRAWL_MAX_CONCURRENCY,
  CRAWL_MAX_INDEX_PAGES,
  CRAWL_MAX_REQUESTS_PER_MINUTE,
  CRAWL_MAX_RETRIES,
  CRAWL_REQUEST_TIMEOUT_SECS,
} from '../config.js';
import { isLiveSourceApproved, type HtmlRoot, type SourceAdapter } from '../sources/types.js';
import { SourceNotApprovedError, SourceStructureError, SourceUnreachableError } from '../utils/errors.js';
import type { RunStats } from '../utils/stats.js';
import { isAllowedHttpUrl } from '../utils/urls.js';

export async function crawlSource<TRaw>(options: {
  adapter: SourceAdapter<TRaw>;
  input: ParsedActorInput;
  stats: RunStats;
  requireIndexLinks?: boolean;
}): Promise<TRaw[]> {
  const { adapter, input, stats } = options;

  if (!isLiveSourceApproved(adapter.approvalEnvVar)) {
    throw new SourceNotApprovedError(
      `${adapter.sourceName} is not approved for live crawling. ${adapter.liveAccessReason} Set ${adapter.approvalEnvVar}=true only after you have reviewed apps/actor/SOURCES.md.`,
    );
  }

  const startUrls = adapter.getStartUrls(input);
  if (startUrls.length === 0) {
    throw new SourceStructureError(`No start URLs were generated for ${adapter.sourceName}.`);
  }

  const records: TRaw[] = [];
  const seen = new Set<string>();
  let indexPages = 0;
  let discoveredDetailLinks = 0;
  const startLabel = adapter.startLabel ?? 'index';
  const requireIndexLinks = options.requireIndexLinks ?? adapter.requireIndexLinks ?? true;
  const startRequests = startUrls
    .filter((url) => isAllowedHttpUrl(url, adapter.allowedHosts, adapter.allowedPathPrefixes))
    .map((url) => ({ url, userData: { label: startLabel } }));

  if (startRequests.length === 0) {
    throw new SourceStructureError(`No allowed start URLs were generated for ${adapter.sourceName}.`);
  }

  const crawler = new CheerioCrawler({
    maxConcurrency: CRAWL_MAX_CONCURRENCY,
    maxRequestRetries: CRAWL_MAX_RETRIES,
    requestHandlerTimeoutSecs: CRAWL_HANDLER_TIMEOUT_SECS,
    navigationTimeoutSecs: CRAWL_REQUEST_TIMEOUT_SECS,
    maxRequestsPerMinute: CRAWL_MAX_REQUESTS_PER_MINUTE,
    retryOnBlocked: false,
    maxRequestsPerCrawl: CRAWL_MAX_INDEX_PAGES + Math.max(12, input.maxResults * 4),
    async requestHandler({ request, $, crawler: currentCrawler }) {
      stats.pagesVisited += 1;
      const url = request.loadedUrl ?? request.url;
      if (!isAllowedHttpUrl(url, adapter.allowedHosts, adapter.allowedPathPrefixes)) {
        log.warning('Skipped URL outside the source allowlist', { url });
        return;
      }

      const label = (request.userData as { label?: string }).label ?? adapter.classifyUrl(url);
      if (label === 'index') {
        indexPages += 1;
        const parsed = adapter.parseIndex($ as unknown as HtmlRoot, url, input);
        discoveredDetailLinks += parsed.detailUrls.length;
        stats.recordsExtracted += parsed.records.length;

        for (const record of parsed.records) {
          records.push(record);
        }

        // Visit every listing URL from the index. Filters such as fundingType often
        // reject a card only after the detail page is read, so capping the queue at
        // maxResults here would skip later matching products.
        for (const detailUrl of parsed.detailUrls) {
          if (seen.has(detailUrl) || records.length >= input.maxResults) {
            continue;
          }

          seen.add(detailUrl);
          await currentCrawler.addRequests([{ url: detailUrl, userData: { label: 'detail' } }]);
        }

        if (indexPages < CRAWL_MAX_INDEX_PAGES) {
          for (const nextUrl of parsed.nextIndexUrls.slice(0, 1)) {
            if (!seen.has(nextUrl) && records.length < input.maxResults) {
              seen.add(nextUrl);
              await currentCrawler.addRequests([{ url: nextUrl, userData: { label: 'index' } }]);
            }
          }
        }

        return;
      }

      if (label === 'detail') {
        if (records.length >= input.maxResults) {
          return;
        }

        const record = adapter.parseDetail($ as unknown as HtmlRoot, url, input);
        if (record) {
          records.push(record);
          stats.recordsExtracted += 1;
          return;
        }

        log.info('Detail page produced no record', { url });
      }
    },
    async errorHandler({ request, response }) {
      const status = response?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) {
        request.noRetry = true;
      }
    },
    async failedRequestHandler({ request }, error) {
      log.warning('Request failed', {
        url: request.url,
        message: error instanceof Error ? error.message : 'Unknown request error',
      });
    },
  });

  await crawler.run(startRequests);

  if (stats.pagesVisited === 0) {
    throw new SourceUnreachableError(`${adapter.sourceName} was unreachable.`);
  }

  if (requireIndexLinks && discoveredDetailLinks === 0 && records.length === 0) {
    throw new SourceStructureError(
      `${adapter.sourceName} was reachable, but no listing or product links were found. The page HTML may have changed.`,
    );
  }

  return records;
}
