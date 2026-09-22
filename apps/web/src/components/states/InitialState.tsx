import { ArrowRight, Sparkles } from 'lucide-react';
import { Glow, GlowLayer } from '@/components/ui/Glow';
import { IconBadge } from '@/components/ui/IconBadge';

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
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <GlowLayer>
        <Glow className="-right-10 -top-10 h-40 w-40 bg-primary/10" />
      </GlowLayer>

      <div className="relative flex flex-col items-start gap-4 sm:flex-row">
        <IconBadge
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          size="lg"
          shape="circle"
          tone="solid"
        />
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          <p className="mt-2 max-w-copy text-sm leading-6 text-muted">{body}</p>
        </div>
      </div>

      <p className="relative mt-8 text-xs font-semibold uppercase tracking-wide text-muted">
        Try one of these
      </p>
      <div className="relative mt-3 grid gap-3 md:grid-cols-3">
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:shadow-md"
            onClick={example.onSelect}
          >
            <span>
              <span className="block text-sm font-semibold text-text transition-colors group-hover:text-white">
                {example.label}
              </span>
              <span className="mt-1 block text-sm text-muted transition-colors group-hover:text-white/80">
                {example.description}
              </span>
            </span>
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-all duration-200 group-hover:translate-x-1 group-hover:text-white"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
