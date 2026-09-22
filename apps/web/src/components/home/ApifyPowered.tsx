import { Globe2, Layers, RefreshCw, Zap } from 'lucide-react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { IconBadge } from '@/components/ui/IconBadge';
import { APIFY_RUN_STATS, APIFY_SOURCES, DEMO_LISTING_COUNT } from '@/lib/stats';

const stats = [
  { icon: Globe2, label: 'Public sources tracked', value: String(APIFY_SOURCES.length) },
  { icon: Layers, label: 'Demo listings', value: String(DEMO_LISTING_COUNT) },
  { icon: Zap, label: 'Last Actor run', value: APIFY_RUN_STATS.lastRunLabel },
  { icon: RefreshCw, label: 'Refresh frequency', value: APIFY_RUN_STATS.refreshFrequency },
];

export function ApifyPowered() {
  return (
    <section className="border-b border-border bg-background py-10 sm:py-12">
      <div className="container-shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Eyebrow>Powered by Apify</Eyebrow>
          <p className="max-w-lg text-sm leading-6 text-muted">
            An Apify Actor crawls approved public sources, records are normalised and
            labelled, and Scouvela shows them here with source links and discovery dates.
          </p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <IconBadge icon={<stat.icon className="h-4 w-4" aria-hidden="true" />} size="md" />
              <dt className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {stat.label}
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-text">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-4 flex flex-wrap gap-2">
          {APIFY_SOURCES.map((source) => (
            <li
              key={source.name}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-sm"
            >
              {source.name} <span className="text-muted">· {source.category}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
