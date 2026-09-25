import { SEARCH_COUNTRIES } from '@scouvela/shared';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';

const DATELINE = /(?:^|[.\n])\s*[A-Za-z .'-]+,\s*(?:[A-Za-z .'-]+)\s*[–—-]\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/i;

export function extractSupportedCountries(text: string): string[] {
  const withoutDateline = text.replace(DATELINE, ' ');
  if (
    /all\s+54\s+african\s+countries/i.test(withoutDateline) ||
    /across\s+(?:all\s+)?africa\b/i.test(withoutDateline) ||
    /\bafrican\s+(?:entrepreneurs?|founders?|startups?|smes?|businesses?)\b/i.test(withoutDateline) ||
    /\bafrica-wide\b|\ball african countries\b/i.test(withoutDateline)
  ) {
    return ['Africa-wide'];
  }

  return SEARCH_COUNTRIES.filter((country) => {
    if (country === 'Africa-wide') {
      return false;
    }

    const pattern = new RegExp(`\\b${escapeRegExp(country)}\\b`, 'i');
    if (pattern.test(withoutDateline)) {
      return true;
    }

    if (country === 'Nigeria') {
      return /\bnigerian\b/i.test(withoutDateline);
    }

    if (country === 'Ghana') {
      return /\bghanaian\b/i.test(withoutDateline);
    }

    if (country === 'Kenya') {
      return /\bkenyan\b/i.test(withoutDateline);
    }

    if (country === 'South Africa') {
      return /\bsouth african\b/i.test(withoutDateline);
    }

    if (country === 'Rwanda') {
      return /\brwandan\b/i.test(withoutDateline);
    }

    return false;
  });
}

export function extractDeadlineDetails(
  text: string,
  options: { publishedAt?: string } = {},
): {
  deadline?: string;
  deadlineText?: string;
  warning?: string;
} {
  const range = text.match(
    /(?:applications?[^.!?]{0,100}?)?(?:are\s+)?open(?:ed)?(?:\s+from)?\s+(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s+(?:to|until|through)\s+(?:midnight on\s+)?(?:the\s+)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  ) ?? text.match(
    /application period runs from\s+(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s+(?:to|until|through)\s+(?:midnight on\s+)?(?:the\s+)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  );

  if (range?.[1] && range[2]) {
    const end = normalizeExplicitDate(range[2]);
    const start = normalizeExplicitDate(range[1]) ?? normalizeExplicitDate(shareYear(range[1], range[2]));
    return {
      deadline: end,
      deadlineText: start && end ? `${range[1]} to ${range[2]}` : `${range[1]} to ${range[2]}`,
    };
  }

  const labeled = text.match(
    /(?:application deadline|deadline|apply by|applications? close(?:s|d)?(?:\s+on)?|closes on|closing date)\s*[:-]?\s*([A-Za-z0-9, ]{4,40})/i,
  );
  if (labeled?.[1]) {
    const deadlineText = emptyToUndefined(labeled[1].replace(/\s+/g, ' '));
    return {
      deadline: deadlineText ? normalizeExplicitDate(deadlineText) : undefined,
      deadlineText,
    };
  }

  const relative = text.match(/\b(\d+)\s+(day|days|hour|hours)\s+left\b/i);
  if (relative?.[1] && relative[2]) {
    const deadlineText = `${relative[1]} ${relative[2]} left`;
    const absolute = absoluteFromRelative(relative[1], relative[2], options.publishedAt);
    if (absolute) {
      return { deadline: absolute, deadlineText };
    }

    return {
      deadlineText,
      warning: 'A relative deadline was found, but no trustworthy publication timestamp was available to convert it.',
    };
  }

  const longForm = text.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/);
  if (longForm?.[0]) {
    return {
      deadline: normalizeExplicitDate(longForm[0]),
      deadlineText: longForm[0],
    };
  }

  const monthFirst = text.match(/\b([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\b/);
  if (monthFirst) {
    const deadlineText = `${monthFirst[2]} ${monthFirst[1]} ${monthFirst[3]}`;
    return {
      deadline: normalizeExplicitDate(deadlineText),
      deadlineText,
    };
  }

  return {};
}

function shareYear(start: string, end: string): string {
  if (/\b\d{4}\b/.test(start)) {
    return start;
  }

  const year = end.match(/\b(\d{4})\b/)?.[1];
  return year ? `${start} ${year}` : start;
}

function absoluteFromRelative(
  amountText: string,
  unitText: string,
  publishedAt: string | undefined,
): string | undefined {
  if (!publishedAt) {
    return undefined;
  }

  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) {
    return undefined;
  }

  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  const result = new Date(published.getTime());
  if (/^hours?$/i.test(unitText)) {
    result.setUTCHours(result.getUTCHours() + amount);
  } else {
    result.setUTCDate(result.getUTCDate() + amount);
  }

  return result.toISOString().slice(0, 10);
}

function normalizeExplicitDate(value: string): string | undefined {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  const iso = cleaned.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (iso) {
    return iso;
  }

  const longForm = cleaned.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (longForm) {
    const month = monthIndex(longForm[2] ?? '');
    if (month == null) {
      return undefined;
    }

    const day = Number(longForm[1]);
    const year = Number(longForm[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString().slice(0, 10);
  }

  const monthFirst = cleaned.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})\b/);
  if (monthFirst) {
    const month = monthIndex(monthFirst[1] ?? '');
    if (month == null) {
      return undefined;
    }

    const day = Number(monthFirst[2]);
    const year = Number(monthFirst[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString().slice(0, 10);
  }

  return undefined;
}

function monthIndex(value: string): number | undefined {
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  return months[value.toLowerCase()];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function uniqueCountries(values: string[] | undefined): string[] | undefined {
  return uniqueNonEmpty(values ?? []);
}
