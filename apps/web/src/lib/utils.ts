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
