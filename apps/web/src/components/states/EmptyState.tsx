type EmptyStateProps = {
  variant: 'funding' | 'vendors';
  onReset: () => void;
};

const copy = {
  funding: {
    title: 'No funding matches these filters',
    body: 'Nothing matched this search on the public funding source. Try a broader keyword, or leave funding type set to All.',
  },
  vendors: {
    title: 'No vendors match these filters',
    body: 'Live vendor listings currently cover Lagos category pages. Try Ikeja or Yaba, another service category, or clear the keyword.',
  },
};

export function EmptyState({ variant, onReset }: EmptyStateProps) {
  const content = copy[variant];

  return (
    <div className="card max-w-2xl" role="status">
      <h2 className="text-lg font-semibold text-text">{content.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{content.body}</p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Remove one filter at a time</li>
        <li>Search with a shorter keyword</li>
        <li>Leave optional fields blank</li>
      </ul>
      <button type="button" className="btn-primary mt-5" onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
}
