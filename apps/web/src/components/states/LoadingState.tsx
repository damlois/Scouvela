import { cn } from '@/lib/utils';

export function LoadingState({
  label = 'Loading search results',
  count = 4,
}: {
  label?: string;
  count?: number;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="card space-y-4">
            <div className={cn('h-3 w-24 rounded bg-border motion-safe:animate-pulse')} />
            <div className="h-6 w-3/4 rounded bg-border motion-safe:animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-border motion-safe:animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-border motion-safe:animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-border motion-safe:animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-border motion-safe:animate-pulse" />
            </div>
            <div className="h-11 w-48 rounded bg-border motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
