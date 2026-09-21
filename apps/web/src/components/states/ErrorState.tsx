type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
  onReset: () => void;
};

export function ErrorState({
  message = 'We could not finish that search. Please try again.',
  onRetry,
  onReset,
}: ErrorStateProps) {
  return (
    <div className="card max-w-2xl border-error/30" role="alert" aria-live="assertive">
      <h2 className="text-lg font-semibold text-text">Something went wrong</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={onRetry}>
          Retry search
        </button>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Reset search
        </button>
      </div>
    </div>
  );
}
