import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string | number; label: string };

export function toOptions(values: readonly (string | number)[]): SelectOption[] {
  return values.map((value) => ({ value, label: String(value) }));
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
  id: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
};

export function SelectField({
  id,
  label,
  options,
  placeholder,
  error,
  className,
  ...selectProps
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn('input appearance-none pr-9', error && 'border-error')}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...selectProps}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
