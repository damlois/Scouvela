import type { Metadata } from 'next';
import { VendorSearchView } from '@/components/search/VendorSearchView';
import type { VendorFilters, VendorSort } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Find vendors',
  description:
    'Search Lagos service providers such as tailors, bakers, printers and packaging vendors.',
};

type SearchParams = {
  state?: string;
  q?: string;
  category?: string;
  ngState?: string;
  locality?: string;
  max?: string;
  sort?: string;
};

function parseSort(value: string | undefined): VendorSort {
  return value === 'recent' || value === 'rating' ? value : 'relevant';
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const previewError = params.state === 'error';
  const initialFilters: VendorFilters = {
    query: params.q,
    serviceCategory: params.category,
    state: params.ngState,
    locality: params.locality,
    maxResults: Number(params.max) || 5,
  };

  return (
    <div className="container-shell section-space space-y-6">
      <header className="max-w-copy space-y-2">
        <p className="text-sm font-semibold text-primary">Local Scout</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text">Find local vendors</h1>
        <p className="text-sm leading-6 text-muted">
          Search tailors, bakers, shoemakers, printers, packaging vendors and related services.
          Live listings currently focus on Lagos. Listings are source-listed, not independently
          verified.
        </p>
      </header>
      <VendorSearchView
        previewError={previewError}
        initialFilters={initialFilters}
        initialSort={parseSort(params.sort)}
        hasInitialSearch={Boolean(params.q || params.category || params.ngState || params.locality)}
      />
    </div>
  );
}
