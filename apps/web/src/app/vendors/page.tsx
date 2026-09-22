import type { Metadata } from 'next';
import { Store } from 'lucide-react';
import { SearchPageHeader } from '@/components/search/SearchPageHeader';
import { VendorSearchView } from '@/components/search/VendorSearchView';
import type { VendorFilters, VendorSort } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Find vendors',
  description:
    'Search sample Lagos service providers such as tailors, bakers, printers and packaging vendors. Open to everyone, not only business owners.',
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
    maxResults: Number(params.max) || 20,
  };

  return (
    <>
      <SearchPageHeader
        eyebrow="Local Scout"
        icon={<Store className="h-4 w-4" aria-hidden="true" />}
        title="Find local vendors"
        description="Find tailors, bakers, printers and more near you."
        chips={['Tailoring', 'Baking', 'Printing', 'Packaging', 'Photography']}
        compact
      />
      <div className="container-shell section-space">
        <VendorSearchView
          previewError={previewError}
          initialFilters={initialFilters}
          initialSort={parseSort(params.sort)}
          hasInitialSearch={Boolean(
            params.q || params.category || params.ngState || params.locality,
          )}
        />
      </div>
    </>
  );
}
