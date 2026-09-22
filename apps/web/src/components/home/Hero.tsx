'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { StatusBadge } from '@/components/results/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Glow, GlowLayer } from '@/components/ui/Glow';
import { TextField } from '@/components/ui/TextField';
import { MOCK_FUNDING, MOCK_VENDORS } from '@/lib/mock-data';
import { formatFundingType, formatServiceCategory } from '@/lib/utils';

const previewFunding = MOCK_FUNDING.filter((item) => item.status !== 'expired').slice(0, 1);
const previewVendors = MOCK_VENDORS.slice(0, 2);

export function Hero() {
  const { isBusiness } = useAudience();
  const router = useRouter();
  const [mode, setMode] = useState<'funding' | 'vendors'>(isBusiness ? 'funding' : 'vendors');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (location.trim()) params.set('ngState', location.trim());
    const query = params.toString();
    router.push(`/${mode}${query ? `?${query}` : ''}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <GlowLayer>
        <Glow className="-left-24 -top-24 h-72 w-72 bg-primary/10" />
        <Glow className="-right-20 top-10 h-72 w-72 bg-accent/15" />
      </GlowLayer>

      <div className="container-shell relative grid items-center gap-12 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <Eyebrow icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />} uppercase={false}>
            {isBusiness ? 'For business owners in Nigeria' : 'Local services in Nigeria'}
          </Eyebrow>

          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            {isBusiness
              ? 'Find funding for your business. Find local services nearby.'
              : 'Find a tailor, baker, printer or photographer nearby.'}
          </h1>

          <p className="mt-5 max-w-copy text-base leading-7 text-muted">
            {isBusiness
              ? 'Scouvela is a source-linked search for SME funding and local vendors. Confirm every listing at the original source before you apply or get in touch.'
              : 'You do not need to run a business to use Scouvela. Search publicly listed local vendors and open the original source to confirm the details.'}
          </p>

          <form
            onSubmit={onSearch}
            className="card mt-7 max-w-xl space-y-3 p-3 shadow-md sm:p-4"
          >
            {isBusiness ? (
              <div className="inline-grid grid-cols-2 gap-0.5 rounded-md border border-border bg-background p-1">
                {(['funding', 'vendors'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => setMode(option)}
                    className={
                      mode === option
                        ? 'rounded px-3 py-1.5 text-sm font-semibold shadow-sm bg-primary text-white'
                        : 'rounded px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-primary'
                    }
                  >
                    {option === 'funding' ? 'Funding' : 'Vendors'}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:divide-x sm:divide-border sm:rounded-md sm:border sm:border-border">
              <TextField
                id="hero-keyword"
                label="Keyword"
                hideLabel
                icon={<Search className="h-4 w-4" aria-hidden="true" />}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={mode === 'funding' ? 'Grant, loan, accelerator' : 'Tailor, baker, printer'}
                maxLength={200}
                className="flex-1"
                inputClassName="sm:border-0 sm:shadow-none sm:rounded-none"
              />
              <TextField
                id="hero-location"
                label="Location"
                hideLabel
                icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Lagos"
                maxLength={100}
                className="flex-1"
                inputClassName="sm:border-0 sm:shadow-none sm:rounded-none"
              />
              <Button type="submit" className="shrink-0 sm:rounded-l-none">
                Search
              </Button>
            </div>
          </form>
        </div>

        <div className="relative">
          <div className="relative h-64 overflow-hidden rounded-2xl shadow-lg sm:h-80">
            <Image
              src="/images/hero-phone-search.jpg"
              alt="A smiling Nigerian woman holding up her phone, ready to search for funding and vendors"
              fill
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-primary/45 via-primary/10 to-transparent"
            />
            <div className="absolute top-3 right-3 hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary shadow-md sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Source-linked results
            </div>
          </div>
          <div className="relative z-10 -mt-10 space-y-3 px-4 sm:-mt-14 sm:px-6">
            {isBusiness
              ? previewFunding.map((item) => (
                  <article key={item.id} className="card space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {formatFundingType(item.fundingType)}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-text">{item.title}</h2>
                        <p className="text-sm text-muted">{item.provider}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </article>
                ))
              : null}
            {(isBusiness ? previewVendors.slice(0, 1) : previewVendors).map((vendor) => (
              <article key={vendor.id} className="card space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {formatServiceCategory(vendor.category)}
                </p>
                <h2 className="text-base font-semibold text-text">{vendor.name}</h2>
                <p className="text-sm text-muted">
                  {vendor.locality}, {vendor.state}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
