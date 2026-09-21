import { describe, expect, it } from 'vitest';
import { calculateFundingStatus, daysUntil, parseDeadline } from '../src/utils/dates.js';

describe('parseDeadline', () => {
  it('parses ISO dates and rejects invalid values', () => {
    expect(parseDeadline('2026-12-31')?.toISOString()).toContain('2026-12-31');
    expect(parseDeadline('not-a-date')).toBeUndefined();
    expect(parseDeadline(undefined)).toBeUndefined();
  });
});

describe('calculateFundingStatus', () => {
  const now = new Date('2026-09-21T08:00:00.000Z');

  it('returns unverified when the deadline is missing or invalid', () => {
    expect(calculateFundingStatus(undefined, now)).toBe('unverified');
    expect(calculateFundingStatus('soon', now)).toBe('unverified');
  });

  it('returns expired when the deadline is in the past', () => {
    expect(calculateFundingStatus('2026-09-01', now)).toBe('expired');
  });

  it('returns closing-soon when the deadline is within 14 days', () => {
    expect(calculateFundingStatus('2026-09-30', now)).toBe('closing-soon');
  });

  it('returns active when the deadline is more than 14 days away', () => {
    expect(calculateFundingStatus('2026-12-31', now)).toBe('active');
  });
});

describe('daysUntil', () => {
  it('rounds remaining days up from the current instant', () => {
    const now = new Date('2026-09-21T08:00:00.000Z');
    const deadline = new Date('2026-09-22T08:00:00.000Z');
    expect(daysUntil(deadline, now)).toBe(1);
  });
});
