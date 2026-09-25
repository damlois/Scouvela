import { load } from 'cheerio';
import type { OpportunityType, ParsedActorInput, TargetGroup } from '@scouvela/shared';
import { GEA_SOURCE_APPROVAL_ENV } from '../config.js';
import { matchesRawOpportunity } from '../input/filters.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { isAllowedHttpUrl } from '../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, RawOpportunity, SourceAdapter } from './types.js';

const SOURCE_NAME = 'Ghana Enterprises Agency';
const ALLOWED_HOSTS = ['gea.gov.gh'] as const;
const ALLOWED_PATH_PREFIXES = ['/d4j', '/2023/01/16/gea-launches-the-sme-high-growth-programme'] as const;
const START_URLS = [
  'https://gea.gov.gh/d4j/',
  'https://gea.gov.gh/2023/01/16/gea-launches-the-sme-high-growth-programme/',
];

function loadPage(html: string): HtmlRoot {
  return load(html) as unknown as HtmlRoot;
}

export function classifyGeaUrl(url: string): PageLabel | null {
  return isAllowedHttpUrl(url, ALLOWED_HOSTS, ALLOWED_PATH_PREFIXES) ? 'detail' : null;
}

function inferType(text: string): OpportunityType {
  if (/grant/i.test(text)) {
    return 'grant';
  }

  if (/training|capacity|workshop|digital/i.test(text)) {
    return 'training';
  }

  return 'business-support';
}

function inferGroups(text: string): TargetGroup[] {
  const groups: TargetGroup[] = [];
  if (/women/i.test(text)) {
    groups.push('women-owned');
  }

  if (/youth/i.test(text)) {
    groups.push('youth-owned');
  }

  if (/pwd|disabilit/i.test(text)) {
    groups.push('disability-inclusive');
  }

  return groups;
}

export function parseGeaDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  const title = emptyToUndefined($('h1').first().text());
  const body = emptyToUndefined($('article, .entry-content, main, .page-content').first().text());
  if (!title || !body) {
    return null;
  }

  const record: RawOpportunity = {
    title,
    provider: SOURCE_NAME,
    providerType: 'government',
    opportunityType: inferType(`${title} ${body}`),
    description: body.slice(0, 4000),
    countries: ['Ghana'],
    targetGroups: inferGroups(body),
    benefits: uniqueNonEmpty(
      $('h2, h3')
        .toArray()
        .map((element) => emptyToUndefined($(element).text()))
        .filter((item): item is string => Boolean(item))
        .slice(0, 6),
    ),
    eligibility: uniqueNonEmpty(
      $('li')
        .toArray()
        .map((element) => emptyToUndefined($(element).text()))
        .filter((item): item is string => Boolean(item))
        .slice(0, 8),
    ),
    applicationUrl: /apply/i.test(body) ? pageUrl : undefined,
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
    applicationsOpen: /apply now/i.test(body),
    language: 'English',
  };

  return matchesRawOpportunity(record, input) ? record : null;
}

export function parseGeaDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  return parseGeaDetail(loadPage(html), pageUrl, input);
}

export const geaGhanaSource: SourceAdapter = {
  sourceId: 'gea-ghana',
  sourceName: SOURCE_NAME,
  countries: ['Ghana'],
  opportunityTypes: ['training', 'grant', 'business-support', 'accelerator'],
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: GEA_SOURCE_APPROVAL_ENV,
  liveAccessReason: 'gea.gov.gh/robots.txt allows all public paths. Only selected programme pages are crawled.',
  startLabel: 'detail',
  requireIndexLinks: false,
  getStartUrls() {
    return START_URLS;
  },
  classifyUrl: classifyGeaUrl,
  parseIndex(): IndexParseResult<RawOpportunity> {
    return { detailUrls: [], nextIndexUrls: [], records: [] };
  },
  parseDetail: parseGeaDetail,
};
