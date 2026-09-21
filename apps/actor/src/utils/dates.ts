export function toIsoDate(value: Date = new Date()): string {
  return value.toISOString();
}

export function parseDeadline(deadline: string | undefined): Date | undefined {
  if (!deadline) {
    return undefined;
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

export function daysUntil(deadline: Date, now: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
}

export type CalculatedFundingStatus = 'active' | 'closing-soon' | 'expired' | 'unverified';

const CLOSING_SOON_DAYS = 14;

export function calculateFundingStatus(
  deadline: string | undefined,
  now: Date = new Date(),
): CalculatedFundingStatus {
  const parsedDeadline = parseDeadline(deadline);

  if (!parsedDeadline) {
    return 'unverified';
  }

  const remainingDays = daysUntil(parsedDeadline, now);

  if (remainingDays < 0) {
    return 'expired';
  }

  if (remainingDays <= CLOSING_SOON_DAYS) {
    return 'closing-soon';
  }

  return 'active';
}
