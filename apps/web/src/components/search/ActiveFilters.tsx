import { X } from 'lucide-react';
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
      <p className="text-sm font-medium text-muted">Active filters</p>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className="inline-flex max-w-full min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 pl-3 pr-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          onClick={() => onRemove(filter.id)}
        >
          <span className="max-w-[16rem] truncate sm:max-w-xs">{filter.label}</span>
          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">Remove {filter.label}</span>
        </button>
      ))}
      <button
        type="button"
        className="px-2 text-sm font-semibold text-primary hover:underline"
        onClick={onClearAll}
      >
        Clear all
      </button>
    </div>
  );
}
