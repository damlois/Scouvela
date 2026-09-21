import { CircleAlert } from 'lucide-react';

export function ErrorState({
  title = 'Search failed',
  message = 'Please check your request and try again.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-md border border-amber/40 bg-white px-4 py-6 text-sm text-charcoal">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 text-amber" aria-hidden="true" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-charcoal/80">{message}</p>
        </div>
      </div>
    </div>
  );
}
