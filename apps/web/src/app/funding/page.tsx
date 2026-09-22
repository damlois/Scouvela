import type { Metadata } from 'next';
import type { FundingType } from '@scouvela/shared';
import { Banknote } from 'lucide-react';
import { AudienceFundingNote } from '@/components/audience/AudienceFundingNote';
import { FundingSearchView } from '@/components/search/FundingSearchView';
import { SearchPageHeader } from '@/components/search/SearchPageHeader';
import type { FundingFilters, FundingSort } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Find funding',
  description:
    'Search sample SME loans, grants, accelerators and support programmes for Nigerian entrepreneurs.',
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
    maxResults: Number(params.max) || 20,
  };

  return (
    <>
      <SearchPageHeader
        eyebrow="Funding Scout"
        icon={<Banknote className="h-4 w-4" aria-hidden="true" />}
        title="Find funding for your business"
        description="Search loans, grants, accelerators and support programmes. Confirm every detail at the original source before you apply."
        chips={['Loans', 'Grants', 'Accelerators', 'Support programmes']}
        compact
      >
        <AudienceFundingNote />
      </SearchPageHeader>
      <div className="container-shell section-space">
        <FundingSearchView
          previewError={previewError}
          initialFilters={initialFilters}
          initialSort={parseSort(params.sort)}
          hasInitialSearch={Boolean(params.q || params.category || params.ngState || params.type)}
        />
      </div>
    </>
  );
}
