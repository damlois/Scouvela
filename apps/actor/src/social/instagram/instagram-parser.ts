import { load } from 'cheerio';
import { extractLinksFromText } from '../../discovery/application-links.js';
import { canonicalizeUrl } from '../../utils/urls.js';
import { emptyToUndefined } from '../../utils/text.js';
import { inspectPublicUrl } from '../url-intake.js';
import type { SocialContent, SocialExtractionStatus } from '../types.js';
import { cleanInstagramCaption } from './instagram-caption.js';

const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const RESERVED_HANDLES = new Set([
  'p',
  'reel',
  'reels',
  'explore',
  'accounts',
  'stories',
  'about',
  'legal',
  'directory',
  'tv',
  'share',
  'direct',
  'blog',
  'help',
  'privacy',
  'developer',
  'developers',
  'careers',
  'about-us',
  'meta',
  'instagram',
]);

export function parseInstagramHtml(options: {
  html: string;
  submittedUrl: string;
  httpStatus: number;
  contentType: SocialContent['contentType'];
  extractedAt: string;
}): SocialContent {
  const $ = load(options.html);
  const description = emptyToUndefined($('meta[property="og:description"]').attr('content'));
  const title = emptyToUndefined($('meta[property="og:title"]').attr('content'));
  const image = emptyToUndefined($('meta[property="og:image"]').attr('content'));
  const canonical = emptyToUndefined($('meta[property="og:url"]').attr('content'));
  const published = emptyToUndefined(
    $('meta[property="article:published_time"]').attr('content') ?? $('time[datetime]').attr('datetime'),
  );
  const pageText = `${title ?? ''} ${$('title').text()}`;
  const warnings: string[] = [];

  if (isUnavailable(options.httpStatus, pageText, options.html)) {
    return baseContent(options, 'unavailable', warnings.concat('The public page was not available.'), {
      sourceUrl: options.submittedUrl,
    });
  }

  if (isBlocked(options.httpStatus, pageText, Boolean(description))) {
    warnings.push('Instagram did not return the public post. No login or CAPTCHA bypass was attempted.');
    return baseContent(options, 'blocked', warnings, { sourceUrl: options.submittedUrl });
  }

  const account = readAccount({
    title,
    description,
    canonical,
    submittedUrl: options.submittedUrl,
    $,
  });
  const caption = cleanInstagramCaption(description);
  const articleText = cleanInstagramCaption(emptyToUndefined($('article').text()));
  const visibleText = articleText && articleText !== caption ? articleText : undefined;
  const textForSignals = [caption, visibleText].filter(Boolean).join('\n');
  const hashtags = readHashtags(textForSignals);
  const externalLinks = uniqueLinks([
    ...extractLinksFromText(textForSignals),
    ...extractLinksFromText(collectScopedHrefs($)),
  ]);
  const sourceUrl = canonical && inspectPublicUrl(canonical).ok ? canonicalizeUrl(canonical) : options.submittedUrl;
  const status = caption && (account.accountName || account.accountHandle) ? 'complete' : 'partial';
  if (status === 'partial') {
    warnings.push('Some public fields were missing from the page.');
  }

  return {
    ...baseContent(options, status, warnings, { sourceUrl }),
    ...account,
    caption,
    visibleText,
    publishedAt: published,
    hashtags,
    externalLinks,
    thumbnailUrl: image && inspectPublicUrl(image).ok ? image : undefined,
  };
}

export function readProfilePostUrls(html: string, pageUrl: string): string[] {
  const $ = load(html);
  const found: string[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) {
      return;
    }

    let absolute: URL;
    try {
      absolute = new URL(href, pageUrl);
    } catch {
      return;
    }

    if (!INSTAGRAM_HOSTS.has(absolute.hostname.toLowerCase())) {
      return;
    }

    const segments = absolute.pathname.split('/').filter(Boolean);
    const head = segments[0]?.toLowerCase();
    if ((head === 'p' || head === 'reel' || head === 'reels') && segments[1]) {
      const normalized = canonicalizeUrl(absolute.toString());
      if (!seen.has(normalized)) {
        seen.add(normalized);
        found.push(normalized);
      }
    }
  });

  return found;
}

function baseContent(
  options: {
    submittedUrl: string;
    contentType: SocialContent['contentType'];
    extractedAt: string;
  },
  extractionStatus: SocialExtractionStatus,
  extractionWarnings: string[],
  extra: { sourceUrl: string },
): SocialContent {
  return {
    platform: 'instagram',
    contentType: options.contentType,
    sourceUrl: extra.sourceUrl,
    hashtags: [],
    externalLinks: [],
    extractedAt: options.extractedAt,
    extractionStatus,
    extractionWarnings,
  };
}

function readAccount(options: {
  title: string | undefined;
  description: string | undefined;
  canonical: string | undefined;
  submittedUrl: string;
  $: ReturnType<typeof load>;
}): Pick<SocialContent, 'accountName' | 'accountHandle' | 'accountUrl'> {
  const titled = options.title?.match(/^(.*?)\s+on Instagram/i);
  const accountName = emptyToUndefined(titled?.[1]);
  const handleFromDescription = options.description?.match(
    /\b([A-Za-z0-9._]{2,30})\s+on\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  )?.[1];
  const handleFromCanonical = handleFromPostUrl(options.canonical) ?? handleFromPostUrl(options.submittedUrl);

  const scopedHandle = options
    .$('header a[href*="instagram.com/"], article a[href*="instagram.com/"], main a[href*="instagram.com/"]')
    .toArray()
    .map((element) => options.$(element).attr('href'))
    .map((href) => (href ? extractValidHandle(href) : undefined))
    .find((handle): handle is string => Boolean(handle));

  const bodyHandle = options
    .$('a[href*="instagram.com/"]')
    .toArray()
    .map((element) => {
      const href = options.$(element).attr('href');
      if (!href || isFooterOrNavLink(options.$(element))) {
        return undefined;
      }

      return extractValidHandle(href);
    })
    .find((handle): handle is string => Boolean(handle));

  const accountHandle =
    validateHandle(handleFromDescription) ??
    validateHandle(handleFromCanonical) ??
    validateHandle(scopedHandle) ??
    validateHandle(bodyHandle);

  return {
    accountName,
    accountHandle,
    accountUrl: accountHandle ? `https://www.instagram.com/${accountHandle}` : undefined,
  };
}

function handleFromPostUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length >= 3 && !['p', 'reel', 'reels'].includes(segments[0]?.toLowerCase() ?? '')) {
      return validateHandle(segments[0]);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function extractValidHandle(href: string): string | undefined {
  try {
    const parsed = new URL(href, 'https://www.instagram.com');
    if (!INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) {
      return undefined;
    }

    const handle = parsed.pathname.split('/').filter(Boolean)[0];
    return validateHandle(handle);
  } catch {
    return undefined;
  }
}

function validateHandle(value: string | undefined): string | undefined {
  const handle = emptyToUndefined(value)?.replace(/^@/, '');
  if (!handle) {
    return undefined;
  }

  if (!/^[A-Za-z0-9._]{2,30}$/.test(handle)) {
    return undefined;
  }

  if (RESERVED_HANDLES.has(handle.toLowerCase())) {
    return undefined;
  }

  return handle;
}

function isFooterOrNavLink(element: ReturnType<ReturnType<typeof load>>): boolean {
  if (element.closest('footer, nav, [role="contentinfo"], [role="navigation"]').length > 0) {
    return true;
  }

  const href = (element.attr('href') ?? '').toLowerCase();
  return /about\.instagram\.com|about\.meta\.com|help\.instagram|developers\.facebook|\/blog\/|\/about-us\/|\/careers\/|\/privacy|\/legal\//.test(
    href,
  );
}

function readHashtags(text: string): string[] {
  return [...new Set([...text.matchAll(/#([A-Za-z0-9_]+)/g)].map((match) => `#${match[1]}`))];
}

function collectScopedHrefs($: ReturnType<typeof load>): string {
  return $('article a[href], main a[href], header a[href]')
    .toArray()
    .map((element) => {
      const node = $(element);
      if (isFooterOrNavLink(node)) {
        return '';
      }

      return node.attr('href') ?? '';
    })
    .join('\n');
}

function uniqueLinks(links: string[]): string[] {
  return [...new Set(links)];
}

function isUnavailable(status: number, pageText: string, html: string): boolean {
  const lowered = `${pageText} ${html.slice(0, 2000)}`.toLowerCase();
  return status === 404 || lowered.includes("sorry, this page isn't available");
}

function isBlocked(status: number, pageText: string, hasDescription: boolean): boolean {
  if (hasDescription) {
    return false;
  }

  const lowered = pageText.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    status === 429 ||
    lowered.includes('log in') ||
    lowered.includes('login') ||
    lowered.includes('captcha')
  );
}
