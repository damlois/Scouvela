import type { FormEvent } from 'react';
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
  onReset,
}: VendorSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="card grid gap-4 md:grid-cols-2" noValidate>
      <div className="md:col-span-2">
        <label htmlFor="vendor-query" className="label">
          Search keyword
        </label>
        <input
          id="vendor-query"
          name="query"
          className="input"
          value={values.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Uniforms, labels, cakes"
          maxLength={200}
          aria-invalid={Boolean(errors.query)}
          aria-describedby={errors.query ? 'vendor-query-error' : 'vendor-demo-hint'}
        />
        <p id="vendor-demo-hint" className="mt-1 text-sm text-muted">
          Demo listings currently focus on Lagos localities such as Yaba, Surulere, Ikeja, Lekki and
          Victoria Island.
        </p>
        {errors.query ? (
          <p id="vendor-query-error" className="mt-1 text-sm text-error" role="alert">
            {errors.query}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="vendor-category" className="label">
          Service category
        </label>
        <select
          id="vendor-category"
          className="input"
          value={values.serviceCategory}
          onChange={(event) => onChange('serviceCategory', event.target.value)}
        >
          <option value="">All services</option>
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="vendor-state" className="label">
          Nigerian state
        </label>
        <select
          id="vendor-state"
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
        <label htmlFor="vendor-locality" className="label">
          Locality
        </label>
        <input
          id="vendor-locality"
          className="input"
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

      <div>
        <label htmlFor="vendor-max-results" className="label">
          Maximum number of results
        </label>
        <select
          id="vendor-max-results"
          className="input"
          value={values.maxResults}
          onChange={(event) => onChange('maxResults', event.target.value)}
          aria-invalid={Boolean(errors.maxResults)}
          aria-describedby={errors.maxResults ? 'vendor-max-error' : undefined}
        >
          {MAX_RESULT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.maxResults ? (
          <p id="vendor-max-error" className="mt-1 text-sm text-error" role="alert">
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

export function filtersFromVendorForm(values: VendorSearchFormProps['values']): VendorFilters {
  return {
    query: values.query.trim() || undefined,
    serviceCategory: values.serviceCategory || undefined,
    state: values.state || undefined,
    locality: values.locality.trim() || undefined,
    maxResults: values.maxResults,
  };
}
