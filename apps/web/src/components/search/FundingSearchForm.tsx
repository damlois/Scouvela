import type { FormEvent } from 'react';
import type { FundingType } from '@scouvela/shared';
import {
  BUSINESS_CATEGORIES,
  FUNDING_TYPE_LABELS,
  MAX_RESULT_OPTIONS,
  NIGERIAN_STATES,
} from '@/lib/constants';
import type { FundingFilters } from '@/lib/search';

type FundingSearchFormProps = {
  values: {
    query: string;
    businessCategory: string;
    state: string;
    fundingType: string;
    maxResults: number;
  };
  errors: Partial<Record<'query' | 'maxResults', string>>;
  isLoading: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export function FundingSearchForm({
  values,
  errors,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: FundingSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="card grid gap-4 md:grid-cols-2" noValidate>
      <div className="md:col-span-2">
        <label htmlFor="funding-query" className="label">
          Search keyword
        </label>
        <input
          id="funding-query"
          name="query"
          className="input"
          value={values.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Working capital, women-led, equipment"
          maxLength={200}
          aria-invalid={Boolean(errors.query)}
          aria-describedby={errors.query ? 'funding-query-error' : undefined}
        />
        {errors.query ? (
          <p id="funding-query-error" className="mt-1 text-sm text-error" role="alert">
            {errors.query}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="funding-category" className="label">
          Business category
        </label>
        <select
          id="funding-category"
          className="input"
          value={values.businessCategory}
          onChange={(event) => onChange('businessCategory', event.target.value)}
        >
          <option value="">All categories</option>
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="funding-state" className="label">
          Nigerian state
        </label>
        <select
          id="funding-state"
          className="input"
          value={values.state}
          onChange={(event) => onChange('state', event.target.value)}
        >
          <option value="">All states</option>
          {NIGERIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="funding-type" className="label">
          Funding type
        </label>
        <select
          id="funding-type"
          className="input"
          value={values.fundingType}
          onChange={(event) => onChange('fundingType', event.target.value)}
        >
          <option value="">All</option>
          {(Object.keys(FUNDING_TYPE_LABELS) as FundingType[]).map((type) => (
            <option key={type} value={type}>
              {FUNDING_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="funding-max-results" className="label">
          Maximum number of results
        </label>
        <select
          id="funding-max-results"
          className="input"
          value={values.maxResults}
          onChange={(event) => onChange('maxResults', event.target.value)}
          aria-invalid={Boolean(errors.maxResults)}
          aria-describedby={errors.maxResults ? 'funding-max-error' : undefined}
        >
          {MAX_RESULT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.maxResults ? (
          <p id="funding-max-error" className="mt-1 text-sm text-error" role="alert">
            {errors.maxResults}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
        <button type="submit" className="btn-primary min-w-36" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="btn-secondary" onClick={onReset} disabled={isLoading}>
          Clear
        </button>
      </div>
    </form>
  );
}

export function filtersFromFundingForm(values: FundingSearchFormProps['values']): FundingFilters {
  return {
    query: values.query.trim() || undefined,
    businessCategory: values.businessCategory || undefined,
    state: values.state || undefined,
    fundingType: (values.fundingType || undefined) as FundingFilters['fundingType'],
    maxResults: values.maxResults,
  };
}
