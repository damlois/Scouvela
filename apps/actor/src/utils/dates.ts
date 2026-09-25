import { CLOSING_SOON_DAYS, type OpportunityStatus } from '@scouvela/shared';
import { emptyToUndefined } from './text.js';

export type CalculatedFundingStatus = 'active' | 'closing-soon' | 'expired' | 'unverified';

const MONTHS: Record<string, number> = {
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

export function toIsoDate(value: Date = new Date()): string {
  return value.toISOString();
}

export function parseDeadline(deadline: string | undefined): Date | undefined {
  const normalized = emptyToUndefined(deadline);
  if (!normalized) {
    return undefined;
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const longDate = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(normalized);
  if (longDate) {
    const month = MONTHS[longDate[2]?.toLowerCase() ?? ''];
    if (month == null) {
      return undefined;
    }

    const parsed = new Date(Date.UTC(Number(longDate[3]), month, Number(longDate[1])));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

export function normalizeDeadline(deadline: string | undefined): string | undefined {
  const parsed = parseDeadline(deadline);
  if (!parsed) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10);
}

export function utcDayDiff(deadline: Date, now: Date): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function daysUntil(deadline: Date, now: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
}

export function calculateFundingStatus(
  deadline: string | undefined,
  now: Date = new Date(),
  applicationsOpen = false,
): CalculatedFundingStatus {
  const parsedDeadline = parseDeadline(deadline);

  if (parsedDeadline) {
    const remainingDays = utcDayDiff(parsedDeadline, now);

    if (remainingDays < 0) {
      return 'expired';
    }

    if (remainingDays <= CLOSING_SOON_DAYS) {
      return 'closing-soon';
    }

    return 'active';
  }

  if (applicationsOpen) {
    return 'active';
  }

  return 'unverified';
}

export function calculateOpportunityStatus(
  deadline: string | undefined,
  now: Date = new Date(),
  options: { applicationsOpen?: boolean; ongoing?: boolean } = {},
): OpportunityStatus {
  const parsedDeadline = parseDeadline(deadline);

  if (parsedDeadline) {
    const remainingDays = utcDayDiff(parsedDeadline, now);

    if (remainingDays < 0) {
      return 'expired';
    }

    if (remainingDays <= CLOSING_SOON_DAYS) {
      return 'closing-soon';
    }

    return 'active';
  }

  if (options.applicationsOpen) {
    return 'active';
  }

  if (options.ongoing) {
    return 'ongoing';
  }

  return 'unverified';
}
