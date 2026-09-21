import { LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Searching public sources…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-teal/20 bg-white px-4 py-6 text-sm text-charcoal">
      <LoaderCircle className="h-4 w-4 animate-spin text-teal" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
