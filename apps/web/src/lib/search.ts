import type {
  FundingOpportunity,
  FundingSearchRequest,
  FundingType,
  ParsedSearchRequest,
  SearchResponse,
  Vendor,
  VendorSearchRequest,
} from '@scouvela/shared';
import { ACTOR_DEFAULT_MAX_RESULTS } from '@scouvela/shared';
import { FUNDING_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from './constants';
import { MOCK_FUNDING, MOCK_VENDORS, type MockFundingOpportunity, type MockVendor } from './mock-data';
import { matchesText } from './utils';

export type FundingFilters = {
  query?: string;
  businessCategory?: string;
  state?: string;
  fundingType?: FundingType;
  maxResults: number;
};

export type VendorFilters = {
  query?: string;
  serviceCategory?: string;
  state?: string;
  locality?: string;
  maxResults: number;
};

export type FundingSort = 'relevant' | 'deadline' | 'recent';
export type VendorSort = 'relevant' | 'recent' | 'rating';

function relevanceScore(haystack: string, query: string | undefined): number {
  if (!query) {
    return 0;
  }

  const normalised = haystack.toLowerCase();
  const needle = query.toLowerCase();

  if (normalised.startsWith(needle)) {
    return 3;
  }

  if (normalised.includes(needle)) {
    return 1;
  }

  return 0;
}

function parseDeadline(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

export function filterFunding(
  records: MockFundingOpportunity[],
  filters: FundingFilters,
): MockFundingOpportunity[] {
  return records.filter((item) => {
    const haystack = `${item.title} ${item.provider} ${item.description ?? ''} ${(item.eligibility ?? []).join(' ')}`;

    return (
      matchesText(haystack, filters.query) &&
      (!filters.businessCategory || item.businessCategory === filters.businessCategory) &&
      matchesText(item.location, filters.state) &&
      (!filters.fundingType || item.fundingType === filters.fundingType)
    );
  });
}

export function sortFunding(
  records: FundingOpportunity[],
  sort: FundingSort,
  query?: string,
): FundingOpportunity[] {
  const copy = [...records];
  const now = Date.now();

  copy.sort((left, right) => {
    if (sort === 'recent') {
      return new Date(right.discoveredAt).getTime() - new Date(left.discoveredAt).getTime();
    }

    if (sort === 'deadline') {
      const leftDeadline = parseDeadline(left.deadline);
      const rightDeadline = parseDeadline(right.deadline);
      const leftUpcoming = leftDeadline !== undefined && leftDeadline >= now;
      const rightUpcoming = rightDeadline !== undefined && rightDeadline >= now;

      if (
        leftUpcoming &&
        rightUpcoming &&
        leftDeadline !== undefined &&
        rightDeadline !== undefined
      ) {
        return leftDeadline - rightDeadline;
      }

      if (leftUpcoming !== rightUpcoming) {
        return leftUpcoming ? -1 : 1;
      }

      if (leftDeadline === undefined && rightDeadline === undefined) {
        return 0;
      }

      return leftDeadline === undefined ? 1 : -1;
    }

    const leftScore = relevanceScore(`${left.title} ${left.provider}`, query);
    const rightScore = relevanceScore(`${right.title} ${right.provider}`, query);
    return rightScore - leftScore;
  });

  return copy;
}

export function filterVendors(records: MockVendor[], filters: VendorFilters): MockVendor[] {
  return records.filter((item) => {
    const haystack = `${item.name} ${item.category} ${item.description ?? ''}`;

    return (
      matchesText(haystack, filters.query) &&
      (!filters.serviceCategory || item.category === filters.serviceCategory) &&
      matchesText(item.state, filters.state) &&
      matchesText(item.locality, filters.locality)
    );
  });
}

export function sortVendors(records: Vendor[], sort: VendorSort, query?: string): Vendor[] {
  const copy = [...records];

  copy.sort((left, right) => {
    if (sort === 'recent') {
      return new Date(right.discoveredAt).getTime() - new Date(left.discoveredAt).getTime();
    }

    if (sort === 'rating') {
      return (right.rating ?? -1) - (left.rating ?? -1);
    }

    const leftScore = relevanceScore(`${left.name} ${left.category}`, query);
    const rightScore = relevanceScore(`${right.name} ${right.category}`, query);
    return rightScore - leftScore;
  });

  return copy;
}

export function searchFunding(
  filters: FundingFilters,
  sort: FundingSort = 'relevant',
): FundingOpportunity[] {
  const filtered = filterFunding(MOCK_FUNDING, filters).map((item) => ({
    ...item,
    kind: 'funding' as const,
  }));
  return sortFunding(filtered, sort, filters.query).slice(0, filters.maxResults);
}

export function searchVendors(filters: VendorFilters, sort: VendorSort = 'relevant'): Vendor[] {
  const filtered = filterVendors(MOCK_VENDORS, filters).map((item) => ({
    ...item,
    kind: 'vendor' as const,
  }));
  return sortVendors(filtered, sort, filters.query).slice(0, filters.maxResults);
}

export function getMockSearchResponse(request: ParsedSearchRequest): SearchResponse {
  if (request.mode === 'funding') {
    const results = searchFunding({
      query: request.query,
      businessCategory: request.businessCategory,
      state: request.state,
      fundingType: request.fundingType,
      maxResults: request.maxResults,
    });

    return {
      mode: 'funding',
      results,
      meta: {
        resultCount: results.length,
        usedMockData: true,
        source: 'mock',
      },
    };
  }

  const results = searchVendors({
    query: request.query,
    serviceCategory: request.serviceCategory,
    state: request.state,
    locality: request.locality,
    maxResults: request.maxResults,
  });

  return {
    mode: 'vendors',
    results,
    meta: {
      resultCount: results.length,
      usedMockData: true,
      source: 'mock',
    },
  };
}

export function defaultFundingFilters(): FundingFilters {
  return { maxResults: ACTOR_DEFAULT_MAX_RESULTS };
}

export function defaultVendorFilters(): VendorFilters {
  return { maxResults: ACTOR_DEFAULT_MAX_RESULTS };
}

export function toFundingSearchRequest(filters: FundingFilters): FundingSearchRequest {
  return {
    mode: 'funding',
    query: filters.query,
    businessCategory: filters.businessCategory,
    state: filters.state,
    fundingType: filters.fundingType,
    maxResults: filters.maxResults,
  };
}

export function toVendorSearchRequest(filters: VendorFilters): VendorSearchRequest {
  return {
    mode: 'vendors',
    query: filters.query,
    serviceCategory: filters.serviceCategory,
    state: filters.state,
    locality: filters.locality,
    maxResults: filters.maxResults,
  };
}

export function describeFundingResults(count: number, filters: FundingFilters): string {
  if (count === 0) {
    const type = filters.fundingType
      ? FUNDING_TYPE_LABELS[filters.fundingType].toLowerCase()
      : 'funding';
    const place = filters.state ? ` in ${filters.state}` : '';
    return `No ${type} opportunities found${place}`;
  }

  const noun = count === 1 ? 'funding opportunity' : 'funding opportunities';
  return `${count} ${noun} found`;
}

export function describeVendorResults(count: number, filters: VendorFilters): string {
  const category = filters.serviceCategory
    ? (SERVICE_CATEGORY_LABELS[filters.serviceCategory] ?? filters.serviceCategory)
    : undefined;

  if (count === 0) {
    const who = category ?? 'vendors';
    const place = [filters.locality, filters.state].filter(Boolean).join(', ');
    return place ? `No vendors found for ${who} in ${place}` : `No vendors found for ${who}`;
  }

  const noun = count === 1 ? 'vendor' : 'vendors';
  return `${count} ${noun} found`;
}

export type ActiveFilter = {
  id: string;
  label: string;
};

export function getFundingActiveFilters(filters: FundingFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.query) {
    chips.push({ id: 'query', label: `Keyword: ${filters.query}` });
  }

  if (filters.businessCategory) {
    chips.push({ id: 'businessCategory', label: filters.businessCategory });
  }

  if (filters.state) {
    chips.push({ id: 'state', label: filters.state });
  }

  if (filters.fundingType) {
    chips.push({ id: 'fundingType', label: FUNDING_TYPE_LABELS[filters.fundingType] });
  }

  return chips;
}

export function getVendorActiveFilters(filters: VendorFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.query) {
    chips.push({ id: 'query', label: `Keyword: ${filters.query}` });
  }

  if (filters.serviceCategory) {
    chips.push({
      id: 'serviceCategory',
      label: SERVICE_CATEGORY_LABELS[filters.serviceCategory] ?? filters.serviceCategory,
    });
  }

  if (filters.state) {
    chips.push({ id: 'state', label: filters.state });
  }

  if (filters.locality) {
    chips.push({ id: 'locality', label: filters.locality });
  }

  return chips;
}
