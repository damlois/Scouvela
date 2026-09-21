import { load } from 'cheerio';
import { log } from 'crawlee';
import type { FundingType, ParsedActorInput } from '@scouvela/shared';
import {
  CRAWL_MAX_INDEX_PAGES,
  FUNDING_SOURCE_APPROVAL_ENV,
} from '../../config.js';
import { emptyToUndefined, uniqueNonEmpty } from '../../utils/text.js';
import { isAllowedHttpUrl, toAbsoluteUrl } from '../../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, SourceAdapter } from '../types.js';

export type RawFundingRecord = {
  title?: string;
  provider?: string;
  fundingType?: FundingType;
  amount?: string;
  eligibility?: string[];
  deadline?: string;
  location?: string;
  description?: string;
  sourceUrl?: string;
  sourceName?: string;
  applicationsOpen?: boolean;
};

const SOURCE_NAME = 'Bank of Industry';
const ALLOWED_HOSTS = ['www.boi.ng'] as const;
const ALLOWED_PATH_PREFIXES = ['/product/', '/product-category/'] as const;
const INDEX_URL = 'https://www.boi.ng/product-category/smes/';

const GENERIC_QUERIES = new Set(['sme', 'smes', 'msme', 'msmes', 'nigeria', 'nigerian']);

function loadPage(html: string): HtmlRoot {
  return load(html) as unknown as HtmlRoot;
}

function isAllowed(url: string): boolean {
  return isAllowedHttpUrl(url, ALLOWED_HOSTS, ALLOWED_PATH_PREFIXES);
}

export function classifyBoiUrl(url: string): PageLabel | null {
  if (!isAllowed(url)) {
    return null;
  }

  const path = new URL(url).pathname.toLowerCase();
  if (path.startsWith('/product-category/')) {
    return 'index';
  }

  if (path.startsWith('/product/')) {
    return 'detail';
  }

  return null;
}

export function getBoiStartUrls(): string[] {
  return [INDEX_URL];
}

export function inferFundingType(text: string): FundingType | undefined {
  const normalized = text.toLowerCase();
  const loan = /\bloans?\b/.test(normalized);
  const grant = /\bgrants?\b/.test(normalized);
  const accelerator = /\baccelerators?\b/.test(normalized);
  const support = /support[- ]programme|intervention programme|matching fund|funding scheme/.test(
    normalized,
  );
  const matched: FundingType[] = [];

  if (loan) {
    matched.push('loan');
  }

  if (grant) {
    matched.push('grant');
  }

  if (accelerator) {
    matched.push('accelerator');
  }

  if (support) {
    matched.push('support-programme');
  }

  return matched.length === 1 ? matched[0] : undefined;
}

function extractAmount(text: string): string | undefined {
  const match = text.match(
    /(?:loan amount|fund size|single obligor limit|up to)\s*[-:]?\s*(₦\s*[\d,.]+\s*(?:billion|million)?)/i,
  );
  return emptyToUndefined(match?.[1]);
}

function extractDeadline(text: string): string | undefined {
  const match = text.match(
    /(?:deadline|closes? on|closing date)\s*[-:]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/i,
  );
  return emptyToUndefined(match?.[1]);
}

function extractEligibility($: HtmlRoot, text: string): string[] | undefined {
  const items = $('main li, .page-content li')
    .toArray()
    .map((element) => emptyToUndefined($(element).text()))
    .filter((item): item is string => Boolean(item))
    .slice(0, 20);

  if (items.length > 0) {
    return uniqueNonEmpty(items);
  }

  const targetMarket = text.match(/target market[:\s]+(.{20,400})/i)?.[1];
  return uniqueNonEmpty([emptyToUndefined(targetMarket)]);
}

function matchesQuery(text: string, query: string | undefined): boolean {
  const normalizedQuery = emptyToUndefined(query)?.toLowerCase();
  if (!normalizedQuery || GENERIC_QUERIES.has(normalizedQuery)) {
    return true;
  }

  return normalizedQuery
    .split(/\s+/)
    .every((word) => text.toLowerCase().includes(word));
}

export function parseBoiIndexHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawFundingRecord> {
  const $ = loadPage(html);
  return parseBoiIndex($, pageUrl, input);
}

export function parseBoiIndex(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawFundingRecord> {
  const detailUrls: string[] = [];
  const nextIndexUrls: string[] = [];
  const records: RawFundingRecord[] = [];

  $('h2.entry-title a').each((_, element) => {
    const href = toAbsoluteUrl($(element).attr('href'), pageUrl);
    if (!href || classifyBoiUrl(href) !== 'detail') {
      return;
    }

    const title = emptyToUndefined($(element).text());
    const snippet = emptyToUndefined($(element).closest('article').find('p').first().text());
    const combined = `${title ?? ''} ${snippet ?? ''}`;
    if (!matchesQuery(combined, input.query)) {
      return;
    }

    if (input.fundingType) {
      const inferred = inferFundingType(combined);
      if (inferred && inferred !== input.fundingType) {
        return;
      }
    }

    detailUrls.push(href);
  });

  $('a[href*="/product-category/smes/page/"]').each((_, element) => {
    const href = toAbsoluteUrl($(element).attr('href'), pageUrl);
    if (!href || classifyBoiUrl(href) !== 'index') {
      return;
    }

    const pageMatch = href.match(/\/page\/(\d+)\//);
    const pageNumber = pageMatch ? Number(pageMatch[1]) : 1;
    if (pageNumber > 1 && pageNumber <= CRAWL_MAX_INDEX_PAGES) {
      nextIndexUrls.push(href);
    }
  });

  return { detailUrls, nextIndexUrls, records };
}

export function parseBoiDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawFundingRecord | null {
  return parseBoiDetail(loadPage(html), pageUrl, input);
}

export function parseBoiDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawFundingRecord | null {
  const title = emptyToUndefined($('h1.entry-title').first().text());
  const body = emptyToUndefined($('.page-content').first().text());
  if (!title || !body) {
    log.info('Skipped BOI product without a title or product body', { pageUrl, title });
    return null;
  }

  const combined = `${title} ${body}`;
  if (!matchesQuery(combined, input.query)) {
    log.info('Skipped BOI product that did not match the query', { pageUrl, title });
    return null;
  }

  const fundingType = inferFundingType(combined);
  if (input.fundingType && fundingType && fundingType !== input.fundingType) {
    log.info('Skipped BOI product whose stated type does not match the input filter', {
      pageUrl,
      title,
      fundingType,
      required: input.fundingType,
    });
    return null;
  }

  if (input.fundingType && !fundingType) {
    log.info('Skipped BOI product that does not clearly state the requested funding type', {
      pageUrl,
      title,
      required: input.fundingType,
    });
    return null;
  }

  return {
    title,
    provider: SOURCE_NAME,
    fundingType,
    amount: extractAmount(combined),
    eligibility: extractEligibility($, combined),
    deadline: extractDeadline(combined),
    location: /nigeria/i.test(combined) ? 'Nigeria' : undefined,
    description: emptyToUndefined(body.slice(0, 4000)),
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
    applicationsOpen: /applications? are open|currently open|apply now/i.test(combined),
  };
}

export const boiFundingSource: SourceAdapter<RawFundingRecord> = {
  sourceName: SOURCE_NAME,
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: FUNDING_SOURCE_APPROVAL_ENV,
  liveAccessReason:
    'www.boi.ng/robots.txt allows public product pages, but a site-wide terms page for automated access could not be confirmed. Live crawls stay off until you approve this source.',
  getStartUrls() {
    return getBoiStartUrls();
  },
  classifyUrl: classifyBoiUrl,
  parseIndex: parseBoiIndex,
  parseDetail: parseBoiDetail,
};
