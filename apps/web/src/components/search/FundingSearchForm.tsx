'use client';

import { useState, type FormEvent } from 'react';
import type { FundingType } from '@scouvela/shared';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectField, toOptions } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import {
  BUSINESS_CATEGORIES,
  FUNDING_STATUS_LABELS,
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

const fundingTypeOptions = (Object.keys(FUNDING_TYPE_LABELS) as FundingType[]).map((type) => ({
  value: type,
  label: FUNDING_TYPE_LABELS[type],
}));

const statusOptions = Object.entries(FUNDING_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function FundingSearchForm({
  values,
  errors,
  isLoading,
  onChange,
  onSubmit,
}: FundingSearchFormProps) {
  // UI-only preview controls: not wired into search/filter logic yet.
  const [status, setStatus] = useState('');
  const [hideExpired, setHideExpired] = useState(false);

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-5 shadow-md sm:p-6" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <TextField
          className="flex-1"
          id="funding-query"
          name="query"
          label="Search keyword"
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={values.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Working capital, women-led, equipment"
          maxLength={200}
          error={errors.query}
        />
        <Button type="submit" className="w-full sm:mt-[1.625rem] sm:w-auto sm:min-w-36" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search funding'}
        </Button>
      </div>

      <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          id="funding-category"
          label="Business category"
          placeholder="All categories"
          options={toOptions(BUSINESS_CATEGORIES)}
          value={values.businessCategory}
          onChange={(event) => onChange('businessCategory', event.target.value)}
        />
        <SelectField
          id="funding-state"
          label="Nigerian state"
          placeholder="All states"
          options={toOptions(NIGERIAN_STATES)}
          value={values.state}
          onChange={(event) => onChange('state', event.target.value)}
        />
        <SelectField
          id="funding-type"
          label="Funding type"
          placeholder="All types"
          options={fundingTypeOptions}
          value={values.fundingType}
          onChange={(event) => onChange('fundingType', event.target.value)}
        />
        <SelectField
          id="funding-status"
          label="Status"
          placeholder="Any status"
          options={statusOptions}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />
        <SelectField
          id="funding-max-results"
          label="Maximum results"
          options={toOptions(MAX_RESULT_OPTIONS)}
          value={values.maxResults}
          onChange={(event) => onChange('maxResults', event.target.value)}
          error={errors.maxResults}
        />
        <div>
          <span className="label">Listings</span>
          <label
            htmlFor="funding-hide-expired"
            className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text"
          >
            <input
              id="funding-hide-expired"
              type="checkbox"
              checked={hideExpired}
              onChange={(event) => setHideExpired(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Hide expired
          </label>
        </div>
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
