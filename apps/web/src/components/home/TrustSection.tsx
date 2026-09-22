'use client';

import { ShieldCheck } from 'lucide-react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Eyebrow } from '@/components/ui/Eyebrow';

export function TrustSection() {
  const { isBusiness } = useAudience();

  const points = [
    'Original source displayed on every card',
    'Discovery date displayed so freshness is visible',
    ...(isBusiness
      ? ['Funding status labelled as Active, Closing Soon, Expired or Unverified']
      : []),
    'Unverified information is named as unverified, never dressed up as confirmed',
  ];

  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="grid gap-10 overflow-hidden rounded-2xl bg-primary p-8 text-white shadow-md sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow tone="inverted">Trust &amp; freshness</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for trust and freshness
            </h2>
            <p className="mt-4 leading-7 text-white/80">
              The useful part is not a longer list. It is knowing where a record came from, when it
              was found, and whether it still looks current.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {points.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-white/15 bg-white/10 p-4 text-sm leading-6 text-white transition-colors hover:bg-white/15"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
