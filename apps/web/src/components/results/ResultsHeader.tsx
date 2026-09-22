import type { ReactNode } from 'react';

type ResultsHeaderProps = {
  summary: string;
  sortId: string;
  sortValue: string;
  sortOptions: Array<{ value: string; label: string }>;
  onSortChange: (value: string) => void;
  onClearFilters?: () => void;
  canClear?: boolean;
};

export function ResultsHeader({
  summary,
  sortId,
  sortValue,
  sortOptions,
  onSortChange,
}: ResultsHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <p className="min-w-0 truncate text-sm font-medium text-text" aria-live="polite">
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={sortId} className="text-sm text-muted">
          Sort
        </label>
        <select
          id={sortId}
          className="input max-w-56"
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ResultGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
}
