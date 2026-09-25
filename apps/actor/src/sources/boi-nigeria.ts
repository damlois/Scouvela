import { load } from 'cheerio';
import { log } from 'crawlee';
import type { OpportunityType, ParsedActorInput } from '@scouvela/shared';
import { BOI_SOURCE_APPROVAL_ENV, CRAWL_MAX_INDEX_PAGES } from '../config.js';
import { matchesQuery, typesOverlap } from '../input/filters.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { isAllowedHttpUrl, toAbsoluteUrl } from '../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, RawOpportunity, SourceAdapter } from './types.js';

const SOURCE_NAME = 'Bank of Industry';
const ALLOWED_HOSTS = ['www.boi.ng'] as const;
const ALLOWED_PATH_PREFIXES = ['/product/', '/product-category/'] as const;
const INDEX_URL = 'https://www.boi.ng/product-category/smes/';

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

export function inferFundingType(text: string): OpportunityType | undefined {
  const normalized = text.toLowerCase();
  const loan = /\bloans?\b/.test(normalized);
  const grant = /\bgrants?\b/.test(normalized);
  const accelerator = /\baccelerators?\b/.test(normalized);
  const support = /support[- ]programme|intervention programme|matching fund|funding scheme/.test(
    normalized,
  );
  const matched: OpportunityType[] = [];

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
    matched.push('business-support');
  }

  return matched.length === 1 ? matched[0] : matched.length > 1 ? 'funding' : undefined;
}

function extractAmount(text: string): string | undefined {
  const match = text.match(
    /(?:loan amount|, size|single obligor limit|up to)\s*[-:]?\s*(₦\s*[\d,.]+\s*(?:billion|million)?)/i,
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

export function parseBoiIndexHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawOpportunity> {
  return parseBoiIndex(loadPage(html), pageUrl, input);
}

export function parseBoiIndex(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawOpportunity> {
  const detailUrls: string[] = [];
  const nextIndexUrls: string[] = [];

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

    const inferred = inferFundingType(combined);
    if (!typesOverlap(inferred, input.opportunityTypes)) {
      return;
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

  return { detailUrls, nextIndexUrls, records: [] };
}

export function parseBoiDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  return parseBoiDetail(loadPage(html), pageUrl, input);
}

export function parseBoiDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
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

  const opportunityType = inferFundingType(combined) ?? 'funding';
  if (!typesOverlap(opportunityType, input.opportunityTypes)) {
    log.info('Skipped BOI product whose stated type does not match the input filter', {
      pageUrl,
      title,
      opportunityType,
    });
    return null;
  }

  return {
    title,
    provider: SOURCE_NAME,
    providerType: 'dfi',
    opportunityType,
    description: body.slice(0, 4000),
    countries: ['Nigeria'],
    fundingAmountText: extractAmount(combined),
    eligibility: extractEligibility($, combined),
    deadline: extractDeadline(combined),
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
    applicationsOpen: /applications? are open|currently open|apply now/i.test(combined),
    language: 'English',
  };
}

export const boiNigeriaSource: SourceAdapter = {
  sourceId: 'boi-nigeria',
  sourceName: SOURCE_NAME,
  countries: ['Nigeria'],
  opportunityTypes: ['loan', 'grant', 'funding', 'business-support', 'accelerator'],
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: BOI_SOURCE_APPROVAL_ENV,
  liveAccessReason:
    'www.boi.ng/robots.txt allows public product pages, but a site-wide terms page for automated access could not be confirmed. Datacenter IPs may receive a WAF interstitial.',
  getStartUrls() {
    return [INDEX_URL];
  },
  classifyUrl: classifyBoiUrl,
  parseIndex: parseBoiIndex,
  parseDetail: parseBoiDetail,
};

/** @deprecated Use boiNigeriaSource */
export const boiFundingSource = boiNigeriaSource;
