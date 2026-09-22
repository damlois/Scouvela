'use client';

import { useAudience } from '@/components/audience/AudienceProvider';

export function HowItWorks() {
  const { isBusiness } = useAudience();

  const steps = [
    {
      title: isBusiness ? 'Tell us what you need' : 'Tell us the service and location',
      body: isBusiness
        ? 'Choose funding or vendors, then add a keyword, category and location.'
        : 'Pick a service category and a place such as Yaba, Ikeja or Lekki.',
    },
    {
      title: 'Scouvela searches and organises results',
      body: 'Matching records are grouped, labelled and capped so the list stays usable.',
    },
    {
      title: 'Review details and continue at the original source',
      body: isBusiness
        ? 'Open the source link to confirm dates, eligibility and contact details before you apply or call.'
        : 'Open the source link to confirm contact details before you get in touch.',
    },
  ];

  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            The process
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            How it works
          </h2>
        </div>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((item, index) => (
            <li key={item.title} className="border-t-2 border-primary pt-4">
              <span className="block text-5xl font-extrabold leading-none text-primary/15">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-semibold text-text">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
