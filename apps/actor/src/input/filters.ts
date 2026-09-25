import type { OpportunityType, ParsedActorInput, SmeOpportunity } from '@scouvela/shared';
import { parseDeadline, utcDayDiff } from '../utils/dates.js';
import { emptyToUndefined } from '../utils/text.js';
import type { RawOpportunity } from '../sources/types.js';

const GENERIC_QUERIES = new Set([
  'sme',
  'smes',
  'msme',
  'msmes',
  'africa',
  'african',
  'opportunity',
  'opportunities',
  'business',
  'nigeria',
  'ghana',
  'kenya',
]);

export function matchesQuery(text: string, query: string | undefined): boolean {
  const normalizedQuery = emptyToUndefined(query)?.toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const words = normalizedQuery.split(/\s+/).filter((word) => !GENERIC_QUERIES.has(word));
  if (words.length === 0) {
    return true;
  }

  const haystack = text.toLowerCase();
  return words.some((word) => haystack.includes(word));
}

export function countriesOverlap(
  recordCountries: readonly string[] | undefined,
  selected: readonly string[],
): boolean {
  if (!recordCountries || recordCountries.length === 0) {
    return true;
  }

  if (selected.includes('Africa-wide') || recordCountries.includes('Africa-wide')) {
    return true;
  }

  return recordCountries.some((country) => selected.includes(country));
}

export function typesOverlap(
  recordType: OpportunityType | undefined,
  selected: readonly OpportunityType[] | undefined,
): boolean {
  if (!selected || selected.length === 0) {
    return true;
  }

  if (!recordType) {
    return false;
  }

  if (selected.includes(recordType)) {
    return true;
  }

  return selected.includes('funding') && (recordType === 'loan' || recordType === 'grant' || recordType === 'funding');
}

export function matchesRawOpportunity(record: RawOpportunity, input: ParsedActorInput): boolean {
  const text = [
    record.title,
    record.description,
    record.provider,
    ...(record.eligibility ?? []),
    ...(record.benefits ?? []),
    ...(record.sectors ?? []),
    ...(record.targetGroups ?? []),
  ]
    .filter(Boolean)
    .join(' ');

  if (!matchesQuery(text, input.query)) {
    return false;
  }

  if (!countriesOverlap(record.countries, input.countries)) {
    return false;
  }

  if (!typesOverlap(record.opportunityType, input.opportunityTypes)) {
    return false;
  }

  if (input.targetGroups && input.targetGroups.length > 0) {
    const groups = record.targetGroups ?? [];
    if (groups.length > 0 && !groups.some((group) => input.targetGroups?.includes(group))) {
      return false;
    }
  }

  return true;
}

export function matchesSavedOpportunity(record: SmeOpportunity, input: ParsedActorInput, now = new Date()): boolean {
  if (!matchesRawOpportunity(record, input)) {
    return false;
  }

  if (!input.includeExpired && record.status === 'expired') {
    return false;
  }

  if (input.requireDeadline && !record.deadline) {
    return false;
  }

  if (input.requireApplicationUrl && !record.applicationUrl) {
    return false;
  }

  if (input.closingWithinDays && record.deadline) {
    const deadline = parseDeadline(record.deadline);
    if (!deadline) {
      return false;
    }

    const remaining = utcDayDiff(deadline, now);
    if (remaining < 0 || remaining > input.closingWithinDays) {
      return false;
    }
  }

  if (input.sectors && input.sectors.length > 0) {
    const sectors = (record.sectors ?? []).map((item) => item.toLowerCase());
    if (
      sectors.length > 0 &&
      !input.sectors.some((sector) => sectors.includes(sector.toLowerCase()))
    ) {
      return false;
    }
  }

  return true;
}
