function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-border motion-safe:animate-pulse ${className}`} />;
}

function FundingCardSkeleton() {
  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Bar className="h-6 w-24 rounded-full" />
        <Bar className="h-6 w-20 rounded-full" />
      </div>

      <div className="space-y-2">
        <Bar className="h-5 w-4/5" />
        <Bar className="h-4 w-1/2" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Bar className="h-14 w-full rounded-lg" />
        <Bar className="h-14 w-full rounded-lg" />
      </div>

      <div className="space-y-2">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <Bar className="h-4 w-1/3" />
        <Bar className="h-3 w-1/4" />
        <Bar className="h-11 w-40 rounded-md" />
      </div>
    </div>
  );
}

function VendorCardSkeleton() {
  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Bar className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Bar className="h-3 w-20" />
            <Bar className="h-5 w-32" />
          </div>
        </div>
        <Bar className="h-6 w-24 rounded-full" />
      </div>

      <Bar className="h-4 w-2/3" />

      <div className="space-y-2">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
      </div>

      <div className="space-y-2">
        <Bar className="h-4 w-1/2" />
        <Bar className="h-4 w-1/3" />
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="flex gap-2">
          <Bar className="h-11 flex-1 rounded-md" />
          <Bar className="h-11 flex-1 rounded-md" />
        </div>
        <Bar className="h-11 w-full rounded-md" />
        <Bar className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function LoadingState({
  label = 'Loading results from the demo dataset',
  count = 4,
  variant = 'funding',
}: {
  label?: string;
  count?: number;
  variant?: 'funding' | 'vendor';
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: count }, (_, index) =>
          variant === 'vendor' ? (
            <VendorCardSkeleton key={index} />
          ) : (
            <FundingCardSkeleton key={index} />
          ),
        )}
      </div>
    </div>
  );
}
