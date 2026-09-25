import { load } from 'cheerio';
import type { ParsedActorInput } from '@scouvela/shared';
import type { PageFetch } from '../social/types.js';
import { fetchPublicPage } from '../social/instagram/instagram-adapter.js';
import type { RawOpportunity } from '../sources/types.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { extractLinksFromText, selectApplicationUrl } from './application-links.js';
import { extractDeadlineDetails, extractSupportedCountries } from './content-facts.js';
import { inferOpportunityType } from './opportunity-type.js';
import { matchReviewedProvider, providerFromHostname } from './reviewed-providers.js';

export type WebpageExtraction =
  | {
      ok: true;
      url: string;
      title?: string;
      text?: string;
      siteName?: string;
      organizationName?: string;
      links: Array<{ url: string; anchorText?: string }>;
    }
  | { ok: false; url: string; status: 'blocked' | 'unavailable'; warning: string };

export async function extractWebpage(url: string, fetchPage: PageFetch = fetchPublicPage): Promise<WebpageExtraction> {
  const page = await fetchPage(url);
  if (!page.ok) {
    return { ok: false, url, status: 'unavailable', warning: page.error };
  }

  if (page.status === 401 || page.status === 403 || page.status === 429) {
    return { ok: false, url, status: 'blocked', warning: 'The public page refused the request.' };
  }

  if (page.status === 404) {
    return { ok: false, url, status: 'unavailable', warning: 'The public page was not found.' };
  }

  return { ok: true, ...readWebpage(page.html, page.finalUrl || url) };
}

export function readWebpage(html: string, pageUrl: string): Omit<Extract<WebpageExtraction, { ok: true }>, 'ok'> {
  const $ = load(html);
  const title = emptyToUndefined(
    $('meta[property="og:title"]').attr('content') ?? $('h1').first().text() ?? $('title').text(),
  );
  const description = emptyToUndefined(
    $('meta[property="og:description"]').attr('content') ?? $('meta[name="description"]').attr('content'),
  );
  const paragraphs = $('main p, article p, p')
    .toArray()
    .map((element) => emptyToUndefined($(element).text()))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
  const text = uniqueNonEmpty([description, ...paragraphs])?.join(' ');
  const siteName = emptyToUndefined($('meta[property="og:site_name"]').attr('content'));
  const organizationName = readOrganizationName(html) ?? siteName;
  const links = $('a[href]')
    .toArray()
    .flatMap((element) => {
      const href = $(element).attr('href');
      if (!href) {
        return [];
      }

      try {
        return [
          {
            url: new URL(href, pageUrl).toString(),
            anchorText: emptyToUndefined($(element).text()),
          },
        ];
      } catch {
        return [];
      }
    });

  return {
    url: pageUrl,
    title,
    text,
    siteName,
    organizationName,
    links: links.slice(0, 40),
  };
}

export function webpageToRaw(
  page: Extract<WebpageExtraction, { ok: true }>,
  _input: ParsedActorInput,
): RawOpportunity | null {
  const description = emptyToUndefined(page.text);
  const title = emptyToUndefined(page.title);
  if (!description || !title) {
    return null;
  }

  const reviewed = matchReviewedProvider(page.url);
  const provider =
    reviewed?.provider ??
    emptyToUndefined(page.organizationName) ??
    emptyToUndefined(page.siteName) ??
    providerFromHostname(page.url);
  if (!provider) {
    return null;
  }

  const countries = extractSupportedCountries(description);
  const deadlineDetails = extractDeadlineDetails(description);
  const textLinks = extractLinksFromText(description);
  const applicationUrl = selectApplicationUrl({
    pageUrl: page.url,
    text: description,
    links: [
      ...page.links,
      ...textLinks.map((url) => ({ url, anchorText: 'apply' })),
    ],
  });

  const warnings = [
    ...(reviewed
      ? []
      : ['Submitted webpage text was extracted without claiming the site is an official provider.']),
    ...(deadlineDetails.warning ? [deadlineDetails.warning] : []),
    ...(countries.length === 0
      ? ['No explicit programme countries were found in the page text.']
      : []),
  ];

  return {
    title: title.slice(0, 180),
    provider: provider.slice(0, 120),
    opportunityType: inferOpportunityType(description),
    description: description.slice(0, 4000),
    countries: countries.length > 0 ? countries : undefined,
    sourceUrl: page.url,
    sourceName: provider.slice(0, 120),
    applicationUrl,
    deadline: deadlineDetails.deadline,
    deadlineText: deadlineDetails.deadlineText,
    sourcePlatform: 'website',
    contentType: 'webpage',
    originalContentUrl: page.url,
    curatedSource: Boolean(reviewed),
    reviewedProviderDomain: Boolean(reviewed),
    applicationPageConfirmed: false,
    extractionWarnings: warnings,
  };
}

function readOrganizationName(html: string): string | undefined {
  const $ = load(html);
  const scripts = $('script[type="application/ld+json"]')
    .toArray()
    .map((element) => emptyToUndefined($(element).html()))
    .filter((item): item is string => Boolean(item));

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script) as unknown;
      const values = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of values) {
        if (!value || typeof value !== 'object') {
          continue;
        }

        const record = value as Record<string, unknown>;
        const type = String(record['@type'] ?? '');
        if (/organization|publisher|newsmediaorganization/i.test(type) && typeof record.name === 'string') {
          return emptyToUndefined(record.name);
        }

        const publisher = record.publisher;
        if (publisher && typeof publisher === 'object' && typeof (publisher as { name?: unknown }).name === 'string') {
          return emptyToUndefined((publisher as { name: string }).name);
        }
      }
    } catch {
      continue;
    }
  }

  return undefined;
}
