import { detectSource } from '../platform-detector.js';
import type { PageFetchResult, SocialContent, SocialSourceAdapter } from '../types.js';
import { parseInstagramHtml, readProfilePostUrls } from './instagram-parser.js';

const REQUEST_TIMEOUT_MS = 15_000;

export const instagramAdapter: SocialSourceAdapter = {
  platform: 'instagram',

  supports(source) {
    return source.platform === 'instagram';
  },

  async extract(source, options) {
    if (source.platform !== 'instagram') {
      return [];
    }

    const fetchPage = options.fetchPage ?? fetchPublicPage;
    const extractedAt = options.extractedAt ?? new Date().toISOString();
    const page = await fetchPage(source.url);
    const primary = contentFromFetch(page, source.url, source.contentType, extractedAt);

    if (
      source.contentType !== 'social-profile' ||
      !options.discoverFromProfiles ||
      page.ok !== true ||
      primary.extractionStatus === 'blocked' ||
      primary.extractionStatus === 'unavailable'
    ) {
      return [primary];
    }

    const postUrls = readProfilePostUrls(page.html, source.url).slice(0, options.maxPostsPerProfile);
    const posts: SocialContent[] = [];
    for (const postUrl of postUrls) {
      const detected = detectSource(postUrl);
      if (detected.platform !== 'instagram' || detected.contentType === 'social-profile') {
        continue;
      }

      const postPage = await fetchPage(postUrl);
      posts.push(contentFromFetch(postPage, postUrl, detected.contentType, extractedAt));
    }

    return [primary, ...posts];
  },
};

export async function fetchPublicPage(url: string): Promise<PageFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'ScouvelaBot/0.4 (public page fetch; no login)',
      },
    });
    const html = await response.text();
    return { ok: true, status: response.status, html, finalUrl: response.url || url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'The public page could not be fetched.',
    };
  } finally {
    clearTimeout(timer);
  }
}

function contentFromFetch(
  page: PageFetchResult,
  submittedUrl: string,
  contentType: SocialContent['contentType'],
  extractedAt: string,
): SocialContent {
  if (!page.ok) {
    return {
      platform: 'instagram',
      contentType,
      sourceUrl: submittedUrl,
      hashtags: [],
      externalLinks: [],
      extractedAt,
      extractionStatus: 'unavailable',
      extractionWarnings: [page.error],
    };
  }

  return parseInstagramHtml({
    html: page.html,
    submittedUrl,
    httpStatus: page.status,
    contentType,
    extractedAt,
  });
}
