'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
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
  searchVendors,
  toVendorSearchRequest,
  type VendorFilters,
  type VendorSort,
} from '@/lib/search';
import { getSearchDelayMs, wait } from '@/lib/utils';

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
  maxResults: 20,
};

const sortOptions = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'recent', label: 'Recently discovered' },
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
    const found = searchVendors(parsed.data, nextSort);
    setResults(found);
    setStatus(found.length === 0 ? 'empty' : 'success');
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
          body="Anyone can search — for home, an event, or a business. This demonstration dataset currently focuses on Lagos. Try a service category and a locality such as Yaba or Ikeja. These vendors are fictional sample listings."
          examples={[
            {
              label: 'Tailoring in Yaba',
              description: 'Made-to-measure and alteration workshops.',
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
              label: 'Baking in Surulere',
              description: 'Wholesale bread, cakes and snack packs.',
              onSelect: () => {
                const next = {
                  ...emptyForm,
                  serviceCategory: 'baking',
                  state: 'Lagos',
                  locality: 'Surulere',
                };
                setValues(next);
                void runSearch(filtersFromVendorForm(next));
              },
            },
            {
              label: 'Printing in Lagos',
              description: 'Labels, flyers and short-run print shops.',
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
        <LoadingState label="Searching the demo vendor dataset" variant="vendor" />
      ) : null}

      {status === 'error' ? (
        <ErrorState
          message="This is the development error preview. Retry to search the local demo data, or reset to start again."
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
              void runSearch(filters, nextSort);
            }}
            onClearFilters={resetAll}
            canClear={activeFilters.length > 0}
          />
          <ResultGrid>
            {results.map((vendor) => (
              <VendorResultCard key={vendor.id} vendor={vendor} />
            ))}
          </ResultGrid>
          {results.length > 0 && results.length <= 3 ? (
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary"
              onClick={() => {
                const next = { ...emptyForm, state: 'Lagos' };
                setValues(next);
                void runSearch(filtersFromVendorForm(next));
              }}
            >
              <span className="text-sm text-muted">
                Only a few results. <span className="font-semibold text-primary">Broaden your search</span> — search all of Lagos.
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
