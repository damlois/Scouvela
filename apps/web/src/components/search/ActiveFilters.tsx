import type { ActiveFilter } from '@/lib/search';

type ActiveFiltersProps = {
  filters: ActiveFilter[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-medium text-text">Active filters</p>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-text"
          onClick={() => onRemove(filter.id)}
        >
          {filter.label}
          <span aria-hidden="true">×</span>
          <span className="sr-only">Remove {filter.label}</span>
        </button>
      ))}
      <button type="button" className="text-sm font-semibold text-primary" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
