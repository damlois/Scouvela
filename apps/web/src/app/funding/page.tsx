import type { Metadata } from 'next';
import type { FundingType } from '@scouvela/shared';
import { AudienceFundingNote } from '@/components/audience/AudienceFundingNote';
import { FundingSearchView } from '@/components/search/FundingSearchView';
import type { FundingFilters, FundingSort } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Find funding',
  description:
    'Search publicly listed SME loans, grants, accelerators and support programmes for Nigerian entrepreneurs.',
};

type SearchParams = {
  state?: string;
  q?: string;
  category?: string;
  ngState?: string;
  type?: string;
  max?: string;
  sort?: string;
};

function parseSort(value: string | undefined): FundingSort {
  return value === 'deadline' || value === 'recent' ? value : 'relevant';
}

export default async function FundingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const previewError = params.state === 'error';
  const initialFilters: FundingFilters = {
    query: params.q,
    businessCategory: params.category,
    state: params.ngState,
    fundingType: params.type as FundingType | undefined,
    maxResults: Number(params.max) || 5,
  };

  return (
    <div className="container-shell section-space space-y-6">
      <header className="max-w-copy space-y-3">
        <p className="text-sm font-semibold text-primary">Funding Scout</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text">Find SME funding</h1>
        <p className="text-sm leading-6 text-muted">
          Search loans, grants, accelerators and support programmes from public listings. Confirm
          every detail at the original source before you apply.
        </p>
        <AudienceFundingNote />
      </header>
      <FundingSearchView
        previewError={previewError}
        initialFilters={initialFilters}
        initialSort={parseSort(params.sort)}
        hasInitialSearch={Boolean(params.q || params.category || params.ngState || params.type)}
      />
    </div>
  );
}
