'use client';

import Image from 'next/image';
import { ArrowRight, Banknote, CheckCircle2, Store } from 'lucide-react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Glow, GlowLayer } from '@/components/ui/Glow';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn } from '@/lib/utils';

type Mode = {
  icon: typeof Banknote;
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  bullets: string[];
  href: string;
  cta: string;
};

function ModeCard({ mode, wide }: { mode: Mode; wide: boolean }) {
  const cta = (
    <Button href={mode.href} className="group/btn">
      {mode.cta}
      <ArrowRight
        className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1"
        aria-hidden="true"
      />
    </Button>
  );

  return (
    <article className="card group flex flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
      <div className="relative h-36 sm:h-44">
        <Image
          src={mode.image}
          alt={mode.imageAlt}
          fill
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div
        className={cn(
          'relative flex flex-1 flex-col p-5 sm:p-6',
          wide && 'md:flex-row md:items-center md:gap-10',
        )}
      >
        {wide ? (
          <GlowLayer>
            <Glow className="-right-16 -top-16 h-56 w-56 bg-primary/10" />
          </GlowLayer>
        ) : null}

        <div className={cn('relative', wide ? 'md:max-w-sm' : '')}>
          <IconBadge
            icon={<mode.icon className={wide ? 'h-6 w-6' : 'h-5 w-5'} aria-hidden="true" />}
            size={wide ? 'lg' : 'md'}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          <h3 className={cn('mt-4 font-semibold text-text', wide ? 'text-xl' : 'text-lg')}>
            {mode.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">{mode.body}</p>
          {wide ? <div className="mt-5">{cta}</div> : null}
        </div>

        <ul className={cn('relative space-y-2', wide ? 'mt-6 md:mt-0 md:flex-1' : 'mt-4')}>
          {mode.bullets.map((bullet) => (
            <li
              key={bullet}
              className={cn(
                'flex items-start gap-2 text-sm text-muted',
                wide && 'rounded-lg border border-border bg-background p-3',
              )}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {bullet}
            </li>
          ))}
        </ul>

        {wide ? null : <div className="relative mt-4">{cta}</div>}
      </div>
    </article>
  );
}

export function SearchModes() {
  const { isBusiness } = useAudience();

  const modes: Mode[] = [
    ...(isBusiness
      ? [
          {
            icon: Banknote,
            image: '/images/funding-scout-growth.jpg',
            imageAlt: 'A hand-drawn upward growth chart with a ruler and pens, representing business growth and funding',
            title: 'Funding Scout',
            body: 'Find loans, grants, accelerators and support programmes currently listed for Nigerian SMEs and business owners.',
            bullets: [
              'A Lagos retailer looking for working capital',
              'A food business checking grant windows before they close',
              'A founder comparing accelerator calls',
            ],
            href: '/funding',
            cta: 'Open Funding Scout',
          },
        ]
      : []),
    {
      icon: Store,
      image: '/images/local-scout-market.jpg',
      imageAlt: 'An aerial view of a bustling street market in Lagos, Nigeria, with colourful umbrellas',
      title: 'Local Scout',
      body: 'Find tailors, bakers, shoemakers, printers, packaging vendors and related services by location.',
      bullets: [
        'A resident looking for a tailor in Yaba',
        'Someone ordering cakes in Surulere',
        'A family booking a photographer in Lekki',
      ],
      href: '/vendors',
      cta: 'Open Local Scout',
    },
  ];

  return (
    <section className="border-y border-border bg-surface section-space">
      <div className="container-shell">
        <div className="max-w-2xl">
          <Eyebrow>How to search</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {isBusiness ? 'Two ways to search' : 'Search local vendors'}
          </h2>
          <p className="mt-3 leading-7 text-muted">
            {isBusiness
              ? 'Pick the scout that matches what you need right now — funding for the business, or a vendor for anything else.'
              : 'One focused way to find vendors nearby, open to anyone.'}
          </p>
        </div>
        <div className={`mt-10 grid gap-6 ${isBusiness ? 'lg:grid-cols-2' : ''}`}>
          {modes.map((mode) => (
            <ModeCard key={mode.title} mode={mode} wide={!isBusiness} />
          ))}
        </div>
      </div>
    </section>
  );
}
