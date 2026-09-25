import { load } from 'cheerio';
import type { ParsedActorInput } from '@scouvela/shared';
import { VENDOR_SOURCE_APPROVAL_ENV } from '../../config.js';
import { ActorInputError } from '../../utils/errors.js';
import { containsNormalized, emptyToUndefined } from '../../utils/text.js';
import { isAllowedHttpUrl, toAbsoluteUrl } from '../../utils/urls.js';
import type { HtmlRoot, IndexParseResult, PageLabel, SourceAdapter } from '../types.js';

export type RawVendorRecord = {
  name?: string;
  category?: string;
  state?: string;
  locality?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  description?: string;
  sourceUrl?: string;
  sourceName?: string;
};

const SOURCE_NAME = 'Finelib.com';
const ALLOWED_HOSTS = ['www.finelib.com'] as const;
const ALLOWED_PATH_PREFIXES = ['/cities/', '/listing/'] as const;
const SUPPORTED_STATE_SLUGS: Record<string, string> = {
  lagos: 'lagos',
};

type CategoryMapping = {
  path: string;
  category: string;
};

const CATEGORY_MAP: Record<string, CategoryMapping> = {
  tailoring: { path: 'clothing/tailoring', category: 'tailoring' },
  tailor: { path: 'clothing/tailoring', category: 'tailoring' },
  bakery: { path: 'food/bakery', category: 'bakery' },
  baker: { path: 'food/bakery', category: 'bakery' },
  baking: { path: 'food/bakery', category: 'bakery' },
  shoemaker: { path: 'clothing/shoes/shoe-repair-and-footwear-services', category: 'shoemaking' },
  shoemaking: { path: 'clothing/shoes/shoe-repair-and-footwear-services', category: 'shoemaking' },
  printer: { path: 'marketing-and-advertisement/advertisement-printing', category: 'printing' },
  printing: { path: 'marketing-and-advertisement/advertisement-printing', category: 'printing' },
  packaging: { path: 'packaging', category: 'packaging' },
};

function loadPage(html: string): HtmlRoot {
  return load(html) as unknown as HtmlRoot;
}

function isFinelibUrl(url: string): boolean {
  return isAllowedHttpUrl(url, ALLOWED_HOSTS, ALLOWED_PATH_PREFIXES);
}

export function resolveVendorCategory(input: ParsedActorInput): CategoryMapping {
  const raw = `${input.query ?? ''} ${(input.sectors ?? []).join(' ')}`.toLowerCase();
  const match = Object.entries(CATEGORY_MAP).find(([key]) => new RegExp(`\\b${key}\\b`, 'i').test(raw));
  if (!match?.[1]) {
    throw new ActorInputError(
      'Vendor search needs a known service category such as tailoring, bakery, shoemaker, printing or packaging.',
    );
  }

  return match[1];
}

export function resolveVendorStateSlug(state: string | undefined): string {
  const normalized = emptyToUndefined(state)?.toLowerCase() ?? 'lagos';
  const slug = SUPPORTED_STATE_SLUGS[normalized];
  if (!slug) {
    throw new ActorInputError(
      'The first vendor source currently supports Lagos listing pages only. Other states were not allowlisted.',
    );
  }

  return slug;
}

export function classifyFinelibUrl(url: string): PageLabel | null {
  if (!isFinelibUrl(url)) {
    return null;
  }

  const path = new URL(url).pathname.toLowerCase();
  if (path.startsWith('/listing/')) {
    return 'detail';
  }

  if (path.startsWith('/cities/')) {
    return 'index';
  }

  return null;
}

export function getFinelibStartUrls(input: ParsedActorInput): string[] {
  const category = resolveVendorCategory(input);
  const stateSlug = resolveVendorStateSlug(input.regions?.[0]);
  return [`https://www.finelib.com/cities/${stateSlug}/business/${category.path}`];
}

function parsePhone(text: string | undefined): string | undefined {
  const match = text?.match(/(?:\+?234|0)\s*\d[\d\s-]{8,16}/);
  return emptyToUndefined(match?.[0]);
}

function parseRating(text: string | undefined): number | undefined {
  const match = text?.match(/\b([0-5](?:\.\d)?)\s*(?:\/\s*5|stars?)?\b/i);
  if (!match?.[1]) {
    return undefined;
  }

  const rating = Number(match[1]);
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : undefined;
}

function localityFromAddress(address: string | undefined, fallback?: string): string | undefined {
  if (fallback) {
    return emptyToUndefined(fallback);
  }

  if (!address) {
    return undefined;
  }

  const parts = address.split(',').map((part) => emptyToUndefined(part)).filter((part): part is string => Boolean(part));
  if (parts.length >= 2) {
    const maybeLocality = parts[parts.length - 2];
    if (maybeLocality && !/lagos|nigeria/i.test(maybeLocality)) {
      return maybeLocality;
    }
  }

  return undefined;
}

function matchesLocality(record: RawVendorRecord, locality: string | undefined): boolean {
  if (!locality) {
    return true;
  }

  return (
    containsNormalized(record.locality, locality) ||
    containsNormalized(record.address, locality) ||
    containsNormalized(record.name, locality)
  );
}

export function parseFinelibIndexHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawVendorRecord> {
  return parseFinelibIndex(loadPage(html), pageUrl, input);
}

export function parseFinelibIndex(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): IndexParseResult<RawVendorRecord> {
  const category = resolveVendorCategory(input);
  const state = emptyToUndefined(input.regions?.[0]) ?? 'Lagos';
  const detailUrls: string[] = [];
  const records: RawVendorRecord[] = [];

  $('.box-682.bg-none').each((_, element) => {
    const nameLink = $(element).find('.box-headings a').first();
    const name = emptyToUndefined(nameLink.text());
    const sourceUrl = toAbsoluteUrl(nameLink.attr('href'), pageUrl);
    if (!name || !sourceUrl || classifyFinelibUrl(sourceUrl) !== 'detail') {
      return;
    }

    const address = emptyToUndefined(
      $(element)
        .find('.listing-info-img .cmpny-lstng-1')
        .first()
        .text(),
    );
    const phone = parsePhone($(element).find('.tel-no-div').text());
    const description = emptyToUndefined($(element).find('.listing-desc').text());
    const record: RawVendorRecord = {
      name,
      category: category.category,
      state,
      locality: localityFromAddress(address, input.regions?.[0] && containsNormalized(address, input.regions[0]) ? input.regions[0] : undefined),
      address,
      phone,
      description,
      sourceUrl,
      sourceName: SOURCE_NAME,
    };

    if (!matchesLocality(record, input.regions?.[0])) {
      return;
    }

    records.push(record);
    detailUrls.push(sourceUrl);
  });

  return { detailUrls, nextIndexUrls: [], records };
}

export function parseFinelibDetailHtml(
  html: string,
  pageUrl: string,
  input: ParsedActorInput,
): RawVendorRecord | null {
  return parseFinelibDetail(loadPage(html), pageUrl, input);
}

export function parseFinelibDetail(
  $: HtmlRoot,
  pageUrl: string,
  input: ParsedActorInput,
): RawVendorRecord | null {
  const category = resolveVendorCategory(input);
  const name = emptyToUndefined($('h1 [itemprop="name"], h1').first().text());
  if (!name) {
    return null;
  }

  const street = emptyToUndefined($('[itemprop="streetAddress"]').first().text());
  const locality = emptyToUndefined($('[itemprop="addressLocality"]').first().text()) ?? emptyToUndefined(input.regions?.[0]);
  const region = emptyToUndefined($('[itemprop="addressRegion"]').first().text());
  const address = emptyToUndefined([street, locality, region].filter(Boolean).join(', '));
  const websiteHref = $('a[href^="http"]')
    .toArray()
    .map((element) => $(element).attr('href'))
    .find((href) => href && !href.includes('finelib.com') && !href.includes('facebook.com') && !href.includes('twitter.com'));

  const record: RawVendorRecord = {
    name,
    category: category.category,
    state: emptyToUndefined(input.regions?.[0]) ?? (region?.includes('Lagos') ? 'Lagos' : undefined) ?? 'Lagos',
    locality,
    address,
    phone: parsePhone($('[itemprop="telephone"]').text() || $('.tel-no-div').first().text()),
    website: websiteHref && !websiteHref.includes('mailto:') ? toAbsoluteUrl(websiteHref, pageUrl) : undefined,
    rating: parseRating($('.right-listing-rating').text()),
    description: emptyToUndefined($('[itemprop="description"]').text()),
    sourceUrl: pageUrl,
    sourceName: SOURCE_NAME,
  };

  if (!matchesLocality(record, input.regions?.[0])) {
    return null;
  }

  return record;
}

export const finelibVendorSource: SourceAdapter<RawVendorRecord> = {
  sourceId: 'finelib-lagos',
  sourceName: SOURCE_NAME,
  countries: ['Nigeria'],
  opportunityTypes: ['other'],
  allowedHosts: ALLOWED_HOSTS,
  allowedPathPrefixes: ALLOWED_PATH_PREFIXES,
  approvalEnvVar: VENDOR_SOURCE_APPROVAL_ENV,
  liveAccessReason:
    'Finelib robots.txt allows category and listing pages, but its terms restrict copying beyond personal use. Live vendor crawls stay off until you confirm permission.',
  getStartUrls: getFinelibStartUrls,
  classifyUrl: classifyFinelibUrl,
  parseIndex: parseFinelibIndex,
  parseDetail: parseFinelibDetail,
};
