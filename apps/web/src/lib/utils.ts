import type { FundingType } from '@scouvela/shared';
import { FUNDING_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from './constants';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) {
    return 'Not specified';
  }

  return values.join(', ');
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Display only — does not affect search, sort, or filter logic. */
export function formatDaysLeft(deadline: string): string | null {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((date.getTime() - Date.now()) / msPerDay);

  if (diffDays < 0) {
    return null;
  }
  if (diffDays === 0) {
    return 'Last day';
  }
  if (diffDays === 1) {
    return '1 day left';
  }

  return `${diffDays} days left`;
}

/** Display only — does not affect search, sort, or filter logic. */
export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((Date.now() - date.getTime()) / msPerDay);

  if (diffDays <= 0) {
    return 'Found today';
  }
  if (diffDays === 1) {
    return 'Found 1 day ago';
  }
  if (diffDays < 30) {
    return `Found ${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return 'Found 1 month ago';
  }
  if (diffMonths < 12) {
    return `Found ${diffMonths} months ago`;
  }

  return `Found on ${formatDate(value)}`;
}

/** Display only. Returns up to two initials from a name, for an avatar badge. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }

  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** Display only. Reduces a URL to just its domain, e.g. https://foo.com/path -> foo.com. */
export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? url;
  }
}

export function formatFundingType(type: FundingType): string {
  return FUNDING_TYPE_LABELS[type];
}

export function formatServiceCategory(category: string): string {
  return SERVICE_CATEGORY_LABELS[category] ?? category;
}

export function matchesText(haystack: string | undefined, needle: string | undefined): boolean {
  if (!needle) {
    return true;
  }

  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

export function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getSearchDelayMs(): number {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 0;
  }

  return 1000;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
