import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  id: string;
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
  inputClassName?: string;
};

export function TextField({
  id,
  label,
  hideLabel,
  hint,
  error,
  icon,
  className,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'label'}>
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className={cn('input', Boolean(icon) && 'pl-10', error && 'border-error', inputClassName)}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(errorId, hintId) || undefined}
          {...inputProps}
        />
      </div>
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
