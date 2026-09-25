import { load } from 'cheerio';
import type { OpportunityType, ParsedActorInput, TargetGroup } from '@scouvela/shared';
import { KCIC_SOURCE_APPROVAL_ENV } from '../config.js';
import { matchesRawOpportunity } from '../input/filters.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { isAllowedHttpUrl } from '../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, RawOpportunity, SourceAdapter } from './types.js';

const SOURCE_NAME = 'Kenya Climate Innovation Center';
const ALLOWED_HOSTS = ['www.kenyacic.org'] as const;
const ALLOWED_PATH_PREFIXES = ['/programmes/'] as const;
const START_URLS = [
  'https://www.kenyacic.org/programmes/greenbiz',
  'https://www.kenyacic.org/programmes/cleantech',
];

function loadPage(html: string): HtmlRoot {
  return load(html) as unknown as HtmlRoot;
}

export function classifyKcicUrl(url: string): PageLabel | null {
  return isAllowedHttpUrl(url, ALLOWED_HOSTS, ALLOWED_PATH_PREFIXES) ? 'detail' : null;
}

function inferType(text: string): OpportunityType {
  if (/competition|challenge/i.test(text)) {
    return 'competition';
  }

  if (/accelerator/i.test(text)) {
    return 'accelerator';
  }

  if (/incubat/i.test(text)) {
    return 'incubator';
  }

  return 'business-support';
}

function inferGroups(text: string): TargetGroup[] {
  const groups: TargetGroup[] = ['green-businesses'];
  if (/youth/i.test(text)) {
    groups.push('youth-owned');
  }

  if (/women/i.test(text)) {
    groups.push('women-owned');
  }

  if (/student/i.test(text)) {
    groups.push('startups');
  }

  return groups;
}

function extractDeadline(text: string): string | undefined {
  const range = text.match(
    /(?:run from|commencing from|from)\s+(\d{1,2}\s*(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\s+to\s+(\d{1,2}\s*(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i,
  );
  return emptyToUndefined(range?.[2]?.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1'));
}

export function parseKcicDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  const title = emptyToUndefined($('h1').first().text());
  const body = emptyToUndefined($('article, .entry-content, main').first().text());
  if (!title || !body) {
    return null;
  }

  const record: RawOpportunity = {
    title,
    provider: SOURCE_NAME,
    providerType: 'accelerator',
    opportunityType: inferType(`${title} ${body}`),
    description: body.slice(0, 4000),
    countries: ['Kenya'],
    sectors: ['green', 'agriculture', 'technology'],
    targetGroups: inferGroups(body),
    eligibility: uniqueNonEmpty(
      $('li')
        .toArray()
        .map((element) => emptyToUndefined($(element).text()))
        .filter((item): item is string => Boolean(item))
        .slice(0, 8),
    ),
    applicationProcess: /submitted online|application portal/i.test(body)
      ? 'Submit the online application on the KCIC website.'
      : undefined,
    applicationUrl: pageUrl,
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
    deadline: extractDeadline(body),
    language: 'English',
  };

  return matchesRawOpportunity(record, input) ? record : null;
}

export function parseKcicDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawOpportunity | null {
  return parseKcicDetail(loadPage(html), pageUrl, input);
}

export const kcicKenyaSource: SourceAdapter = {
  sourceId: 'kcic-kenya',
  sourceName: SOURCE_NAME,
  countries: ['Kenya'],
  opportunityTypes: ['accelerator', 'incubator', 'competition', 'training', 'business-support'],
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: KCIC_SOURCE_APPROVAL_ENV,
  liveAccessReason:
    'No robots.txt was published at www.kenyacic.org on 2026-09-24. Only public /programmes/ pages are requested.',
  startLabel: 'detail',
  requireIndexLinks: false,
  getStartUrls() {
    return START_URLS;
  },
  classifyUrl: classifyKcicUrl,
  parseIndex(): IndexParseResult<RawOpportunity> {
    return { detailUrls: [], nextIndexUrls: [], records: [] };
  },
  parseDetail: parseKcicDetail,
};
