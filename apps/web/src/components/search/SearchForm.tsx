'use client';

import { useState, type FormEvent } from 'react';
import {
  apiErrorSchema,
  searchResponseSchema,
  type FundingType,
  type SearchRequest,
  type SearchResponse,
} from '@scouvela/shared';
import { Search } from 'lucide-react';
import { FundingResultCard } from '@/components/results/FundingResultCard';
import { VendorResultCard } from '@/components/results/VendorResultCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';

const fundingTypes: Array<FundingType | ''> = [
  '',
  'loan',
  'grant',
  'accelerator',
  'support-programme',
];

type SearchFormProps = {
  mode: SearchRequest['mode'];
};

export function SearchForm({ mode }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [category, setCategory] = useState('');
  const [fundingType, setFundingType] = useState<FundingType | ''>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Search failed.');
  const [response, setResponse] = useState<SearchResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('Search failed.');

    const payload: SearchRequest =
      mode === 'funding'
        ? {
            mode: 'funding',
            query: query || undefined,
            businessCategory: category || undefined,
            state: state || undefined,
            locality: locality || undefined,
            fundingType: fundingType || undefined,
            maxResults: 20,
          }
        : {
            mode: 'vendors',
            query: query || undefined,
            serviceCategory: category || undefined,
            state: state || undefined,
            locality: locality || undefined,
            maxResults: 20,
          };

    try {
      const result = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json: unknown = await result.json();

      if (!result.ok) {
        const parsedError = apiErrorSchema.safeParse(json);
        setErrorMessage(parsedError.success ? parsedError.data.error.message : 'Search failed.');
        setStatus('error');
        return;
      }

      const parsedResponse = searchResponseSchema.safeParse(json);
      if (!parsedResponse.success) {
        setErrorMessage('The server returned an unexpected response.');
        setStatus('error');
        return;
      }

      setResponse(parsedResponse.data);
      setStatus('success');
    } catch {
      setErrorMessage('Search is temporarily unavailable.');
      setStatus('error');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-teal/20 bg-white p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Query
          <input
            className="rounded border border-teal/30 px-3 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mode === 'funding' ? 'MSME loan' : 'tailor'}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {mode === 'funding' ? 'Business category' : 'Service category'}
          <input
            className="rounded border border-teal/30 px-3 py-2"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder={mode === 'funding' ? 'retail' : 'baker'}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          State
          <input
            className="rounded border border-teal/30 px-3 py-2"
            value={state}
            onChange={(event) => setState(event.target.value)}
            placeholder="Lagos"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Locality
          <input
            className="rounded border border-teal/30 px-3 py-2"
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            placeholder="Ikeja"
          />
        </label>
        {mode === 'funding' ? (
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Funding type
            <select
              className="rounded border border-teal/30 px-3 py-2"
              value={fundingType}
              onChange={(event) => setFundingType(event.target.value as FundingType | '')}
            >
              {fundingTypes.map((type) => (
                <option key={type || 'any'} value={type}>
                  {type || 'Any'}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded bg-teal px-4 py-2 text-sm font-medium text-white md:col-span-2"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </form>

      {status === 'idle' ? (
        <p className="text-sm text-charcoal/80">Submit a search to confirm routing, Tailwind and shared types.</p>
      ) : null}
      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState message={errorMessage} /> : null}
      {status === 'success' && response?.meta.resultCount === 0 ? <EmptyState /> : null}
      {status === 'success' && response?.mode === 'funding'
        ? response.results.map((opportunity) => (
            <FundingResultCard key={opportunity.id} opportunity={opportunity} />
          ))
        : null}
      {status === 'success' && response?.mode === 'vendors'
        ? response.results.map((vendor) => <VendorResultCard key={vendor.id} vendor={vendor} />)
        : null}
    </div>
  );
}
