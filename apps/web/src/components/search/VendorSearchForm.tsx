import type { FormEvent } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectField, toOptions } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import {
  LAGOS_LOCALITIES,
  MAX_RESULT_OPTIONS,
  NIGERIAN_STATES,
  SERVICE_CATEGORIES,
} from '@/lib/constants';
import type { VendorFilters } from '@/lib/search';

type VendorSearchFormProps = {
  values: {
    query: string;
    serviceCategory: string;
    state: string;
    locality: string;
    maxResults: number;
  };
  errors: Partial<Record<'query' | 'maxResults', string>>;
  isLoading: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export function VendorSearchForm({
  values,
  errors,
  isLoading,
  onChange,
  onSubmit,
}: VendorSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-5 shadow-md sm:p-6" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <TextField
          className="flex-1"
          id="vendor-query"
          name="query"
          label="Search keyword"
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={values.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Uniforms, labels, cakes"
          maxLength={200}
          error={errors.query}
        />
        <Button type="submit" className="w-full sm:mt-[1.625rem] sm:w-auto sm:min-w-36" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search vendors'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          id="vendor-category"
          label="Service category"
          placeholder="All services"
          options={SERVICE_CATEGORIES}
          value={values.serviceCategory}
          onChange={(event) => onChange('serviceCategory', event.target.value)}
        />
        <SelectField
          id="vendor-state"
          label="Nigerian state"
          placeholder="All states"
          options={toOptions(NIGERIAN_STATES)}
          value={values.state}
          onChange={(event) => onChange('state', event.target.value)}
        />
        <div>
          <TextField
            id="vendor-locality"
            label="Locality"
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            list="lagos-localities"
            value={values.locality}
            onChange={(event) => onChange('locality', event.target.value)}
            placeholder="Yaba"
          />
          <datalist id="lagos-localities">
            {LAGOS_LOCALITIES.map((locality) => (
              <option key={locality} value={locality} />
            ))}
          </datalist>
        </div>
        <SelectField
          id="vendor-max-results"
          label="Maximum results"
          options={toOptions(MAX_RESULT_OPTIONS)}
          value={values.maxResults}
          onChange={(event) => onChange('maxResults', event.target.value)}
          error={errors.maxResults}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Popular:</span>
        {LAGOS_LOCALITIES.map((locality) => (
          <button
            key={locality}
            type="button"
            onClick={() => onChange('locality', locality)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
          >
            {locality}
          </button>
        ))}
      </div>

    </form>
  );
}

export function filtersFromVendorForm(values: VendorSearchFormProps['values']): VendorFilters {
  return {
    query: values.query.trim() || undefined,
    serviceCategory: values.serviceCategory || undefined,
    state: values.state || undefined,
    locality: values.locality.trim() || undefined,
    maxResults: values.maxResults,
  };
}
