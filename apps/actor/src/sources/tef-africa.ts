import { load } from 'cheerio';
import type { ParsedActorInput } from '@scouvela/shared';
import { TEF_SOURCE_APPROVAL_ENV } from '../config.js';
import { matchesRawOpportunity } from '../input/filters.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { isAllowedHttpUrl } from '../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, RawOpportunity, SourceAdapter } from './types.js';

const SOURCE_NAME = 'Tony Elumelu Foundation';
const ALLOWED_HOSTS = ['www.tonyelumelufoundation.org'] as const;
const ALLOWED_PATH_PREFIXES = ['/tef-entrepreneurship-programme', '/press-releases/'] as const;
const START_URLS = [
  'https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme',
  'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026',
];

function loadPage(html: string): HtmlRoot {
  return load(html) as unknown as HtmlRoot;
}

export function classifyTefUrl(url: string): PageLabel | null {
  return isAllowedHttpUrl(url, ALLOWED_HOSTS, ALLOWED_PATH_PREFIXES) ? 'detail' : null;
}

function extractDeadline(text: string): string | undefined {
  const window = text.match(
    /(?:open(?:ed|s)?|applications?)\s+(?:from|are open from)\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+to\s+(?:midnight on\s+)?(?:the\s+)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  );
  if (window?.[2]) {
    return emptyToUndefined(window[2]);
  }

  const march = text.match(/1(?:st)?\s+of\s+March\s+(\d{4})/i);
  if (march?.[1]) {
    return `1 March ${march[1]}`;
  }

  return undefined;
}

export function parseTefDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  const title = emptyToUndefined($('h1').first().text()) ?? 'TEF Entrepreneurship Programme';
  const body = emptyToUndefined($('article, .entry-content, main').first().text());
  if (!body) {
    return null;
  }

  const published = emptyToUndefined(
    $('time').first().text() || body.match(/([A-Za-z]+ \d{1,2},?\s+\d{4})/)?.[1],
  );
  const deadline = extractDeadline(body);
  const eligibility = uniqueNonEmpty(
    $('li')
      .toArray()
      .map((element) => emptyToUndefined($(element).text()))
      .filter((item): item is string => Boolean(item) && /african|18 years|business/i.test(item ?? ''))
      .slice(0, 8),
  );

  const record: RawOpportunity = {
    title,
    provider: SOURCE_NAME,
    providerType: 'foundation',
    opportunityType: 'accelerator',
    description: body.slice(0, 4000),
    countries: ['Africa-wide'],
    targetGroups: ['youth-owned', 'women-owned', 'startups'],
    businessStages: ['idea', 'early-stage'],
    benefits: uniqueNonEmpty([
      /US\$5,000|seed capital/i.test(body) ? 'US$5,000 non-refundable seed capital' : undefined,
      /training/i.test(body) ? 'Business training' : undefined,
      /mentor/i.test(body) ? 'Mentorship' : undefined,
    ]),
    fundingAmountText: /US\$5,000/.test(body) ? 'US$5,000 non-refundable seed capital' : undefined,
    eligibility,
    applicationProcess: /TEFConnect/i.test(body)
      ? 'Apply online through TEFConnect during the annual application window.'
      : undefined,
    applicationUrl: 'https://www.tefconnect.com/',
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
    publishedAt: published,
    deadline,
    ongoing: !deadline && /every year|annual/i.test(body),
    isRemote: true,
    language: 'English',
  };

  return matchesRawOpportunity(record, input) ? record : null;
}

export function parseTefDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  return parseTefDetail(loadPage(html), pageUrl, input);
}

export const tefAfricaSource: SourceAdapter = {
  sourceId: 'tef-africa',
  sourceName: SOURCE_NAME,
  countries: ['Africa-wide', 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda'],
  opportunityTypes: ['accelerator', 'grant', 'training', 'mentorship'],
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: TEF_SOURCE_APPROVAL_ENV,
  liveAccessReason:
    'robots.txt allows public programme and press pages. TEFConnect registration and login pages are not crawled.',
  startLabel: 'detail',
  requireIndexLinks: false,
  getStartUrls() {
    return START_URLS;
  },
  classifyUrl: classifyTefUrl,
  parseIndex(): IndexParseResult<RawOpportunity> {
    return { detailUrls: [], nextIndexUrls: [], records: [] };
  },
  parseDetail: parseTefDetail,
};
