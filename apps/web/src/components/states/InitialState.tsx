type Example = {
  label: string;
  description: string;
  onSelect: () => void;
};

export function InitialState({
  title,
  body,
  examples,
}: {
  title: string;
  body: string;
  examples: Example[];
}) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="mt-2 max-w-copy text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            className="rounded-md border border-border bg-background px-4 py-3 text-left hover:border-primary"
            onClick={example.onSelect}
          >
            <span className="block text-sm font-semibold text-text">{example.label}</span>
            <span className="mt-1 block text-sm text-muted">{example.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
