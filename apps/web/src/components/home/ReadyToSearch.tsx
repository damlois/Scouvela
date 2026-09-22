'use client';

import { ArrowRight } from 'lucide-react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Glow, GlowLayer } from '@/components/ui/Glow';

export function ReadyToSearch() {
  const { isBusiness } = useAudience();

  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-sm sm:px-12">
          <GlowLayer>
            <Glow className="-left-16 -top-16 h-56 w-56 bg-primary/10" />
            <Glow className="-bottom-16 -right-16 h-56 w-56 bg-accent/15" />
          </GlowLayer>
          <div className="relative mx-auto max-w-xl">
            <Eyebrow>Get started</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Ready to search?
            </h2>
            <p className="mt-4 leading-7 text-muted">
              {isBusiness
                ? 'Look up SME funding or find a local vendor. This demonstration uses sample records; every result still keeps its original source link.'
                : 'Search local vendors in the demonstration dataset. Every result still keeps its original source link.'}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isBusiness ? (
                <Button href="/funding" className="group/btn">
                  Find Funding
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
              ) : null}
              <Button
                href="/vendors"
                variant={isBusiness ? 'secondary' : 'primary'}
                className="group/btn"
              >
                Find Vendors
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
