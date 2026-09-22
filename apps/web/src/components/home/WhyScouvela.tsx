'use client';

import { CalendarClock, Link2, ListFilter, Search } from 'lucide-react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { IconBadge } from '@/components/ui/IconBadge';

export function WhyScouvela() {
  const { isBusiness } = useAudience();

  const features = [
    {
      icon: Search,
      title: 'Searches public sources',
      body: 'Looks across relevant public listings instead of one isolated page.',
    },
    {
      icon: ListFilter,
      title: 'Organises the noise',
      body: isBusiness
        ? 'Groups loans, grants, accelerators, support programmes and vendors.'
        : 'Groups local services by category and location so you can scan faster.',
    },
    {
      icon: Link2,
      title: 'Keeps the original link',
      body: 'Every card points back to the source so you can confirm the details.',
    },
    {
      icon: CalendarClock,
      title: 'Shows when it was found',
      body: 'Discovery dates help you judge how fresh a listing is before you act.',
    },
  ];

  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="max-w-2xl">
          <Eyebrow>Why Scouvela</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {isBusiness
              ? 'The information is scattered. The timing still matters.'
              : 'Useful local services are hard to find in one place.'}
          </h2>
          <p className="mt-4 max-w-copy leading-7 text-muted">
            {isBusiness
              ? 'SME funding details live across agency sites, programme pages and one-off announcements, and they go stale quickly. Local vendors are just as hard to find — for the shop and for everyday needs.'
              : 'Tailors, bakers, printers, photographers and packaging vendors are listed across many public pages. Scouvela brings those listings together and keeps the original source on every card.'}
          </p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <li
              key={item.title}
              className="card group shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:shadow-lg"
            >
              <IconBadge
                icon={<item.icon className="h-5 w-5" aria-hidden="true" />}
                className="transition-colors group-hover:bg-white group-hover:text-primary"
              />
              <h3 className="mt-2.5 font-semibold text-primary transition-colors group-hover:text-white">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted transition-colors group-hover:text-white/80">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
