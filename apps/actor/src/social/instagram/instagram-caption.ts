import { emptyToUndefined } from '../../utils/text.js';

const MONTH =
  'January|February|March|April|May|June|July|August|September|October|November|December';

/**
 * Strip Instagram Open Graph wrapper text from a public post description.
 * Pattern: `N likes, M comments - handle on Month D, YYYY: "caption"`
 */
export function cleanInstagramCaption(raw: string | undefined): string | undefined {
  const initial = emptyToUndefined(raw);
  if (!initial) {
    return undefined;
  }

  let text = decodeBasicEntities(initial).replace(/\s+/g, ' ').trim();

  const structured = new RegExp(
    `^(?:\\d[\\d,]*\\s+likes?,\\s*\\d[\\d,]*\\s+comments?\\s*[-–—]\\s*)?(?:[A-Za-z0-9._]{2,30}\\s+on\\s+(?:${MONTH})\\s+\\d{1,2},?\\s+\\d{4}:\\s*)?["“]?([\\s\\S]*?)["”]?\\s*$`,
    'i',
  );
  const matched = text.match(structured);
  if (matched?.[1] && matched[1].trim().length > 0) {
    text = matched[1].trim();
  } else {
    text = text
      .replace(/^\d[\d,]*\s+likes?,?\s+\d[\d,]*\s+comments?\s*[-–—:]\s*/i, '')
      .replace(new RegExp(`^[A-Za-z0-9._]{2,30}\\s+on\\s+(?:${MONTH})\\s+\\d{1,2},?\\s+\\d{4}:\\s*`, 'i'), '')
      .replace(/^["“]|["”]$/g, '')
      .trim();
  }

  text = collapseDuplicateBlocks(text);
  return emptyToUndefined(text);
}

/** Prefer a single caption; drop a second copy that only repeats the first. */
export function mergeSocialText(caption?: string, visibleText?: string): string | undefined {
  const cleanedCaption = cleanInstagramCaption(caption);
  const cleanedVisible = cleanInstagramCaption(visibleText);

  if (!cleanedCaption && !cleanedVisible) {
    return undefined;
  }

  if (!cleanedCaption) {
    return cleanedVisible;
  }

  if (!cleanedVisible || cleanedVisible === cleanedCaption) {
    return cleanedCaption;
  }

  if (cleanedVisible.includes(cleanedCaption) || cleanedCaption.includes(cleanedVisible)) {
    return cleanedCaption.length >= cleanedVisible.length ? cleanedCaption : cleanedVisible;
  }

  return `${cleanedCaption}\n${cleanedVisible}`;
}

function collapseDuplicateBlocks(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const halfway = Math.floor(normalized.length / 2);
  if (halfway < 40) {
    return normalized;
  }

  const left = normalized.slice(0, halfway).trim();
  const right = normalized.slice(halfway).trim();
  if (left.length > 40 && (right === left || right.startsWith(left) || left.startsWith(right))) {
    return left;
  }

  const repeated = normalized.match(/^(.{40,}?)\s+\1$/);
  if (repeated?.[1]) {
    return repeated[1].trim();
  }

  return normalized;
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x2014;/gi, '—')
    .replace(/&#x2013;/gi, '–')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'");
}
