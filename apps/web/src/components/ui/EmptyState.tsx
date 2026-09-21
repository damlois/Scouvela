import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No matching results',
  message = 'Try another query, state or category. Mock mode only returns sample records.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-teal/30 bg-white px-4 py-6 text-sm text-charcoal">
      <div className="flex items-start gap-3">
        <Inbox className="mt-0.5 h-5 w-5 text-teal" aria-hidden="true" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-charcoal/80">{message}</p>
        </div>
      </div>
    </div>
  );
}
