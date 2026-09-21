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
  sortFunding,
  toFundingSearchRequest,
  type FundingFilters,
  type FundingSort,
} from '@/lib/search';
import { requestSearch, SearchApiError } from '@/lib/search-api';

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
  maxResults: 5,
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
  const [errorMessage, setErrorMessage] = useState(
    'We could not finish that search. Please try again.',
  );
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
          fieldErrors.maxResults = 'Choose between 1 and 20 results.';
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setFilters(nextFilters);
    setSort(nextSort);
    setStatus('loading');
    persist(nextFilters, nextSort);

    try {
      const response = await requestSearch(parsed.data);
      if (response.mode !== 'funding') {
        throw new SearchApiError('Search returned an unexpected result set.', 502);
      }

      const found = sortFunding(response.results, nextSort, nextFilters.query);
      setResults(found);
      setStatus(found.length === 0 ? 'empty' : 'success');
    } catch (error) {
      setResults([]);
      setErrorMessage(
        error instanceof SearchApiError
          ? error.message
          : 'We could not finish that search. Please try again.',
      );
      setStatus('error');
    }
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
          body="Start with a keyword such as SME. Live results come from Bank of Industry public product pages. Confirm every detail at the original source before you apply."
          examples={[
            {
              label: 'SME products',
              description: 'Public Bank of Industry SME listings.',
              onSelect: () => {
                const next = { ...emptyForm, query: 'SME' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
            {
              label: 'Loans',
              description: 'Only pages that clearly state a loan.',
              onSelect: () => {
                const next = { ...emptyForm, query: 'SME', fundingType: 'loan' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
            {
              label: 'Support programmes',
              description: 'Matching funds and similar stated schemes.',
              onSelect: () => {
                const next = { ...emptyForm, fundingType: 'support-programme' };
                setValues(next);
                void runSearch(filtersFromFundingForm(next));
              },
            },
          ]}
        />
      ) : null}

      {status === 'loading' ? (
        <LoadingState label="Searching public funding listings. This can take up to a minute." />
      ) : null}

      {status === 'error' ? (
        <ErrorState
          message={
            previewError
              ? 'This is the development error preview. Retry to run a live search, or reset to start again.'
              : errorMessage
          }
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
              setSort(nextSort);
              persist(filters, nextSort);
              setResults((current) => sortFunding(current, nextSort, filters.query));
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
