'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fundingSearchRequestSchema, type FundingOpportunity } from '@scouvela/shared';
import { FundingResultCard } from '@/components/results/FundingResultCard';
import { ResultGrid, ResultsHeader } from '@/components/results/ResultsHeader';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { filtersFromFundingForm, FundingSearchForm } from '@/components/search/FundingSearchForm';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { InitialState } from '@/components/states/InitialState';
import { LoadingState } from '@/components/states/LoadingState';
import {
  defaultFundingFilters,
  describeFundingResults,
  getFundingActiveFilters,
  searchFunding,
  toFundingSearchRequest,
  type FundingFilters,
  type FundingSort,
} from '@/lib/search';
import { getSearchDelayMs, wait } from '@/lib/utils';

type FormValues = {
  query: string;
  businessCategory: string;
  state: string;
  fundingType: string;
  maxResults: number;
};

type ViewStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const emptyForm: FormValues = {
  query: '',
  businessCategory: '',
  state: '',
  fundingType: '',
  maxResults: 20,
};

const sortOptions = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'deadline', label: 'Deadline soonest' },
  { value: 'recent', label: 'Recently discovered' },
];

function valuesFromFilters(filters: FundingFilters): FormValues {
  return {
    query: filters.query ?? '',
    businessCategory: filters.businessCategory ?? '',
    state: filters.state ?? '',
    fundingType: filters.fundingType ?? '',
    maxResults: filters.maxResults,
  };
}

function writeQueryString(filters: FundingFilters, sort: FundingSort): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.businessCategory) params.set('category', filters.businessCategory);
  if (filters.state) params.set('ngState', filters.state);
  if (filters.fundingType) params.set('type', filters.fundingType);
  params.set('max', String(filters.maxResults));
  if (sort !== 'relevant') params.set('sort', sort);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function FundingSearchView({
  previewError = false,
  initialFilters,
  initialSort = 'relevant',
  hasInitialSearch = false,
}: {
  previewError?: boolean;
  initialFilters?: FundingFilters;
  initialSort?: FundingSort;
  hasInitialSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const startingFilters = initialFilters ?? defaultFundingFilters();
  const [values, setValues] = useState<FormValues>(valuesFromFilters(startingFilters));
  const [filters, setFilters] = useState<FundingFilters>(startingFilters);
  const [sort, setSort] = useState<FundingSort>(initialSort);
  const [status, setStatus] = useState<ViewStatus>(previewError ? 'error' : 'idle');
  const [results, setResults] = useState<FundingOpportunity[]>([]);
  const [errors, setErrors] = useState<Partial<Record<'query' | 'maxResults', string>>>({});

  const activeFilters = useMemo(() => getFundingActiveFilters(filters), [filters]);

  function updateField(field: string, value: string) {
    setValues((current) => ({
      ...current,
      [field]: field === 'maxResults' ? Number(value) : value,
    }));
  }

  function persist(nextFilters: FundingFilters, nextSort: FundingSort) {
    router.replace(`${pathname}${writeQueryString(nextFilters, nextSort)}`, { scroll: false });
  }

  async function runSearch(nextFilters: FundingFilters, nextSort: FundingSort = sort) {
    const parsed = fundingSearchRequestSchema.safeParse(toFundingSearchRequest(nextFilters));
    if (!parsed.success) {
      const fieldErrors: Partial<Record<'query' | 'maxResults', string>> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'query')
          fieldErrors.query = 'Enter a shorter keyword, up to 200 characters.';
        if (issue.path[0] === 'maxResults')
          fieldErrors.maxResults = 'Choose between 1 and 50 results.';
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setFilters(nextFilters);
    setSort(nextSort);
    setStatus('loading');
    persist(nextFilters, nextSort);

    await wait(getSearchDelayMs());
    const found = searchFunding(parsed.data, nextSort);
    setResults(found);
    setStatus(found.length === 0 ? 'empty' : 'success');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') {
      return;
    }

    void runSearch(filtersFromFundingForm(values), sort);
  }

  function resetAll() {
    setValues(emptyForm);
    setFilters(defaultFundingFilters());
    setSort('relevant');
    setResults([]);
    setErrors({});
    setStatus('idle');
    router.replace(pathname, { scroll: false });
  }

  function removeFilter(id: string) {
    const nextValues = {
      ...values,
      ...(id === 'query' ? { query: '' } : {}),
      ...(id === 'businessCategory' ? { businessCategory: '' } : {}),
      ...(id === 'state' ? { state: '' } : {}),
      ...(id === 'fundingType' ? { fundingType: '' } : {}),
    };
    setValues(nextValues);
    void runSearch(filtersFromFundingForm(nextValues), sort);
  }

  useEffect(() => {
    if (previewError || !hasInitialSearch) {
      return;
    }

    void runSearch(startingFilters, initialSort);
    // Initial URL hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <FundingSearchForm
        values={values}
        errors={errors}
        isLoading={status === 'loading'}
        onChange={updateField}
        onSubmit={onSubmit}
        onReset={resetAll}
      />

      {status !== 'idle' && status !== 'error' ? (
        <ActiveFilters filters={activeFilters} onRemove={removeFilter} onClearAll={resetAll} />
      ) : null}

      {status === 'idle' ? (
        <InitialState
          title="Search public funding listings"
          body="Start with a keyword, a state or a funding type. These demonstration records are fictional sample listings, not live calls."
          examples={[
            {
              label: 'Loans in Lagos',
              description: 'Working capital and asset finance samples.',
              onSelect: () => {
                const next = { ...emptyForm, state: 'Lagos', fundingType: 'loan' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
            {
              label: 'Open grants',
              description: 'Grant listings, including closing-soon and expired examples.',
              onSelect: () => {
                const next = { ...emptyForm, fundingType: 'grant' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
            {
              label: 'Accelerators',
              description: 'Founder programmes with mentoring and seed support.',
              onSelect: () => {
                const next = { ...emptyForm, fundingType: 'accelerator' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
          ]}
        />
      ) : null}

      {status === 'loading' ? <LoadingState label="Searching the demo funding dataset" /> : null}

      {status === 'error' ? (
        <ErrorState
          message="This is the development error preview. Retry to search the local demo data, or reset to start again."
          onRetry={() => void runSearch(filtersFromFundingForm(values), sort)}
          onReset={resetAll}
        />
      ) : null}

      {status === 'empty' ? <EmptyState variant="funding" onReset={resetAll} /> : null}

      {status === 'success' ? (
        <div className="space-y-4">
          <ResultsHeader
            summary={describeFundingResults(results.length, filters)}
            sortId="funding-sort"
            sortValue={sort}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const nextSort = value as FundingSort;
              setValues(valuesFromFilters(filters));
              void runSearch(filters, nextSort);
            }}
            onClearFilters={resetAll}
            canClear={activeFilters.length > 0}
          />
          <ResultGrid>
            {results.map((opportunity) => (
              <FundingResultCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </ResultGrid>
        </div>
      ) : null}
    </div>
  );
}
