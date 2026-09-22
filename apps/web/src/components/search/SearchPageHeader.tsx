'use client';

import { useState, type ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Glow, GlowLayer } from '@/components/ui/Glow';
import { cn } from '@/lib/utils';

type SearchPageHeaderProps = {
  eyebrow: string;
  icon: ReactNode;
  title: string;
  description: string;
  chips?: string[];
  /** Tighter heading size and vertical padding, for pages where the search panel should stay above the fold. */
  compact?: boolean;
  children?: ReactNode;
};

export function SearchPageHeader({
  eyebrow,
  icon,
  title,
  description,
  chips,
  compact = false,
  children,
}: SearchPageHeaderProps) {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <GlowLayer>
        <Glow className="-left-20 -top-20 h-64 w-64 bg-primary/10" />
        <Glow className="-right-16 top-4 h-56 w-56 bg-accent/15" />
      </GlowLayer>
      <div
        className={cn(
          'container-shell relative space-y-4',
          compact ? 'py-6 sm:py-8' : 'space-y-5 py-12 sm:py-16',
        )}
      >
        <Eyebrow icon={icon} uppercase={false}>
          {eyebrow}
        </Eyebrow>
        <h1
          className={cn(
            'max-w-2xl font-semibold tracking-tight text-text',
            compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl',
          )}
        >
          {title}
        </h1>
        <p className={cn('max-w-copy text-muted', compact ? 'text-sm leading-6' : 'text-base leading-7')}>
          {description}
        </p>
        {chips?.length ? (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const selected = selectedChip === chip;
              return (
                <li key={chip}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedChip((current) => (current === chip ? null : chip))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-surface text-text shadow-sm hover:border-primary hover:text-primary',
                    )}
                  >
                    {chip}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {children}
      </div>
    </section>
  );
}
