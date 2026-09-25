import { inspectPublicUrl } from '../social/url-intake.js';
import { emptyToUndefined } from '../utils/text.js';

const CTA_ANCHOR = /\b(?:apply(?:\s+now)?|application|register|submit|get started)\b/i;
const PENALIZED_PATH = /privacy|terms|cookie|login|signup|careers|help|about-us|developer|blog|share|mailto:/i;
const CORPORATE_HOSTS = new Set([
  'instagram.com',
  'www.instagram.com',
  'meta.com',
  'www.meta.com',
  'about.meta.com',
  'about.instagram.com',
  'help.instagram.com',
  'developers.facebook.com',
  'www.facebook.com',
  'facebook.com',
  'threads.com',
  'www.threads.com',
  'muse.ai',
  'www.meta.ai',
  'meta.ai',
]);

export type RankedLink = {
  url: string;
  score: number;
  reasons: string[];
};

export function extractLinksFromText(text: string): string[] {
  const matches = [
    ...text.matchAll(/\bhttps?:\/\/[^\s"'<>]+/gi),
    ...text.matchAll(/\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s"'<>]*)?/gi),
  ];

  const accepted: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const raw = match[0]?.replace(/[),.;:!?]+$/g, '') ?? '';
    const normalized = normalizeExplicitLink(raw);
    if (!normalized || seen.has(normalized) || isCorporateHost(normalized)) {
      continue;
    }

    seen.add(normalized);
    accepted.push(normalized);
  }

  return accepted;
}

export function normalizeExplicitLink(value: string): string | undefined {
  const trimmed = emptyToUndefined(value);
  if (!trimmed || trimmed === '#' || /^javascript:/i.test(trimmed)) {
    return undefined;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const verdict = inspectPublicUrl(candidate);
  if (!verdict.ok) {
    return undefined;
  }

  try {
    const parsed = new URL(verdict.normalizedUrl);
    if (!parsed.hostname.includes('.')) {
      return undefined;
    }

    return verdict.normalizedUrl;
  } catch {
    return undefined;
  }
}

export function selectApplicationUrl(options: {
  pageUrl: string;
  text?: string;
  links: Array<{ url: string; anchorText?: string }>;
}): string | undefined {
  const ranked = rankApplicationLinks(options);
  return ranked[0]?.url;
}

export function rankApplicationLinks(options: {
  pageUrl: string;
  text?: string;
  links: Array<{ url: string; anchorText?: string }>;
}): RankedLink[] {
  const page = safeUrl(options.pageUrl);
  const textLinks = extractLinksFromText(options.text ?? '');
  const candidates = new Map<string, RankedLink>();

  for (const link of textLinks) {
    addCandidate(candidates, link, 45, ['Mentioned in the opportunity text.']);
  }

  for (const link of options.links) {
    if (!link.url || link.url.trim() === '#' || /^javascript:/i.test(link.url)) {
      continue;
    }

    const normalized = normalizeExplicitLink(link.url);
    if (!normalized) {
      continue;
    }

    const parsed = safeUrl(normalized);
    if (!parsed) {
      continue;
    }

    if (isCorporateHost(normalized) || PENALIZED_PATH.test(`${parsed.pathname} ${parsed.hostname}`)) {
      continue;
    }

    const reasons: string[] = [];
    let score = 10;
    const anchor = link.anchorText ?? '';

    if (page && samePageIgnoringHash(parsed, page)) {
      score -= 60;
      reasons.push('Same-page link.');
    }

    if (parsed.hash && page && samePageIgnoringHash(parsed, page)) {
      score -= 40;
      reasons.push('Same-page fragment link.');
    }

    if (parsed.hash === '#' || normalized.endsWith('#')) {
      score -= 50;
      reasons.push('Empty fragment link.');
    }

    if (CTA_ANCHOR.test(anchor)) {
      score += 50;
      reasons.push('Anchor text indicates an application action.');
    }

    if (/apply|application|register|submit|tefconnect/i.test(`${parsed.hostname}${parsed.pathname}`)) {
      score += 35;
      reasons.push('URL path or host looks like an application destination.');
    }

    if (page && parsed.hostname !== page.hostname) {
      score += 25;
      reasons.push('External application destination.');
    }

    if (textLinks.includes(normalized)) {
      score += 40;
      reasons.push('Also stated in the opportunity text.');
    }

    if (score <= 0) {
      continue;
    }

    addCandidate(candidates, normalized, score, reasons);
  }

  return [...candidates.values()].sort((left, right) => right.score - left.score || left.url.localeCompare(right.url));
}

function addCandidate(
  candidates: Map<string, RankedLink>,
  url: string,
  score: number,
  reasons: string[],
): void {
  const existing = candidates.get(url);
  if (!existing) {
    candidates.set(url, { url, score, reasons });
    return;
  }

  existing.score += score;
  existing.reasons = [...new Set([...existing.reasons, ...reasons])];
}

function isCorporateHost(url: string): boolean {
  try {
    return CORPORATE_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function samePageIgnoringHash(left: URL, right: URL): boolean {
  return left.origin === right.origin && left.pathname === right.pathname && left.search === right.search;
}

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}
