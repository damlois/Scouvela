'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { vendorSearchRequestSchema, type Vendor } from '@scouvela/shared';
import { ResultGrid, ResultsHeader } from '@/components/results/ResultsHeader';
import { VendorResultCard } from '@/components/results/VendorResultCard';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { filtersFromVendorForm, VendorSearchForm } from '@/components/search/VendorSearchForm';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { InitialState } from '@/components/states/InitialState';
import { LoadingState } from '@/components/states/LoadingState';
import {
  defaultVendorFilters,
  describeVendorResults,
  getVendorActiveFilters,
  sortVendors,
  toVendorSearchRequest,
  type VendorFilters,
  type VendorSort,
} from '@/lib/search';
import { requestSearch, SearchApiError } from '@/lib/search-api';

type FormValues = {
  query: string;
  serviceCategory: string;
  state: string;
  locality: string;
  maxResults: number;
};

type ViewStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const emptyForm: FormValues = {
  query: '',
  serviceCategory: '',
  state: '',
  locality: '',
  maxResults: 5,
};

const sortOptions = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'recent', label: 'Recently discovered' },
  { value: 'rating', label: 'Highest listed rating' },
];

function writeQueryString(filters: VendorFilters, sort: VendorSort): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.serviceCategory) params.set('category', filters.serviceCategory);
  if (filters.state) params.set('ngState', filters.state);
  if (filters.locality) params.set('locality', filters.locality);
  params.set('max', String(filters.maxResults));
  if (sort !== 'relevant') params.set('sort', sort);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function valuesFromFilters(filters: VendorFilters): FormValues {
  return {
    query: filters.query ?? '',
    serviceCategory: filters.serviceCategory ?? '',
    state: filters.state ?? '',
    locality: filters.locality ?? '',
    maxResults: filters.maxResults,
  };
}

export function VendorSearchView({
  previewError = false,
  initialFilters,
  initialSort = 'relevant',
  hasInitialSearch = false,
}: {
  previewError?: boolean;
  initialFilters?: VendorFilters;
  initialSort?: VendorSort;
  hasInitialSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const startingFilters = initialFilters ?? defaultVendorFilters();
  const [values, setValues] = useState<FormValues>(valuesFromFilters(startingFilters));
  const [filters, setFilters] = useState<VendorFilters>(startingFilters);
  const [sort, setSort] = useState<VendorSort>(initialSort);
  const [status, setStatus] = useState<ViewStatus>(previewError ? 'error' : 'idle');
  const [results, setResults] = useState<Vendor[]>([]);
  const [errorMessage, setErrorMessage] = useState(
    'We could not finish that search. Please try again.',
  );
  const [errors, setErrors] = useState<Partial<Record<'query' | 'maxResults', string>>>({});

  const activeFilters = useMemo(() => getVendorActiveFilters(filters), [filters]);

  function updateField(field: string, value: string) {
    setValues((current) => ({
      ...current,
      [field]: field === 'maxResults' ? Number(value) : value,
    }));
  }

  function persist(nextFilters: VendorFilters, nextSort: VendorSort) {
    router.replace(`${pathname}${writeQueryString(nextFilters, nextSort)}`, { scroll: false });
  }

  async function runSearch(nextFilters: VendorFilters, nextSort: VendorSort = sort) {
    const parsed = vendorSearchRequestSchema.safeParse(toVendorSearchRequest(nextFilters));
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

    if (!nextFilters.serviceCategory && !nextFilters.query) {
      setErrorMessage('Choose a service category such as tailoring, or enter a keyword.');
      setStatus('error');
      return;
    }

    setErrors({});
    setFilters(nextFilters);
    setSort(nextSort);
    setStatus('loading');
    persist(nextFilters, nextSort);

    try {
      const response = await requestSearch(parsed.data);
      if (response.mode !== 'vendors') {
        throw new SearchApiError('Search returned an unexpected result set.', 502);
      }

      const found = sortVendors(response.results, nextSort, nextFilters.query);
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

    void runSearch(filtersFromVendorForm(values), sort);
  }

  function resetAll() {
    setValues(emptyForm);
    setFilters(defaultVendorFilters());
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
      ...(id === 'serviceCategory' ? { serviceCategory: '' } : {}),
      ...(id === 'state' ? { state: '' } : {}),
      ...(id === 'locality' ? { locality: '' } : {}),
    };
    setValues(nextValues);
    void runSearch(filtersFromVendorForm(nextValues), sort);
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
      <VendorSearchForm
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
          title="Browse Lagos service listings"
          body="Live results currently come from Finelib Lagos category pages. Try tailoring in Ikeja or Yaba. Confirm every listing at the original source."
          examples={[
            {
              label: 'Tailoring in Ikeja',
              description: 'Lagos tailoring listings filtered to Ikeja.',
              onSelect: () => {
                const next = {
                  ...emptyForm,
                  serviceCategory: 'tailoring',
                  state: 'Lagos',
                  locality: 'Ikeja',
                };
                setValues(next);
                void runSearch(filtersFromVendorForm(next));
              },
            },
            {
              label: 'Tailoring in Yaba',
              description: 'Lagos tailoring listings filtered to Yaba.',
              onSelect: () => {
                const next = {
                  ...emptyForm,
                  serviceCategory: 'tailoring',
                  state: 'Lagos',
                  locality: 'Yaba',
                };
                setValues(next);
                void runSearch(filtersFromVendorForm(next));
              },
            },
            {
              label: 'Printing in Lagos',
              description: 'Public print-shop listings for Lagos.',
              onSelect: () => {
                const next = { ...emptyForm, serviceCategory: 'printing', state: 'Lagos' };
                setValues(next);
                void runSearch(filtersFromVendorForm(next));
              },
            },
          ]}
        />
      ) : null}

      {status === 'loading' ? (
        <LoadingState label="Searching public vendor listings. This can take up to a minute." />
      ) : null}

      {status === 'error' ? (
        <ErrorState
          message={
            previewError
              ? 'This is the development error preview. Retry to run a live search, or reset to start again.'
              : errorMessage
          }
          onRetry={() => void runSearch(filtersFromVendorForm(values), sort)}
          onReset={resetAll}
        />
      ) : null}

      {status === 'empty' ? <EmptyState variant="vendors" onReset={resetAll} /> : null}

      {status === 'success' ? (
        <div className="space-y-4">
          <ResultsHeader
            summary={describeVendorResults(results.length, filters)}
            sortId="vendor-sort"
            sortValue={sort}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const nextSort = value as VendorSort;
              setSort(nextSort);
              persist(filters, nextSort);
              setResults((current) => sortVendors(current, nextSort, filters.query));
            }}
            onClearFilters={resetAll}
            canClear={activeFilters.length > 0}
          />
          <ResultGrid>
            {results.map((vendor) => (
              <VendorResultCard key={vendor.id} vendor={vendor} />
            ))}
          </ResultGrid>
        </div>
      ) : null}
    </div>
  );
}
