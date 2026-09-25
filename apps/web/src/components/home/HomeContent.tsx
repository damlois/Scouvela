import Link from 'next/link';
import {
  Banknote,
  CalendarClock,
  Link2,
  ListFilter,
  Search,
  ShieldAlert,
  Store,
} from 'lucide-react';
import { StatusBadge } from '@/components/results/StatusBadge';
import { MOCK_FUNDING, MOCK_VENDORS } from '@/lib/mock-data';
import { formatFundingType, formatServiceCategory } from '@/lib/utils';

const previewFunding = MOCK_FUNDING.filter((item) => item.status !== 'expired').slice(0, 2);
const previewVendors = MOCK_VENDORS.slice(0, 2);

export function HomeContent() {
  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="container-shell grid items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold text-primary">Discovery for people in Nigeria</p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Find SME funding and local services, with the original source on every result.
            </h1>
            <p className="mt-4 max-w-copy text-base leading-7 text-muted">
              Scouvela searches publicly listed funding programmes and local vendors. Confirm every
              listing at the original source before you apply or get in touch.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/funding" className="btn-primary">
                Find Funding
              </Link>
              <Link href="/vendors" className="btn-secondary">
                Find Vendors
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">Sample results from the demo dataset</p>
            {previewFunding.map((item) => (
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
            ))}
            {previewVendors.map((vendor) => (
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
      </section>

      <section className="section-space">
        <div className="container-shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-text">
              The information is scattered. The timing still matters.
            </h2>
            <p className="mt-4 leading-7 text-muted">
              SME funding details live across agency sites, programme pages and one-off
              announcements, and they go stale quickly. Local vendors are just as hard to find in
              one place. Scouvela brings those public listings together.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Search,
                title: 'Searches public sources',
                body: 'Looks across relevant public listings instead of one isolated page.',
              },
              {
                icon: ListFilter,
                title: 'Organises the noise',
                body: 'Groups loans, grants, accelerators, support programmes and vendors.',
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
            ].map((item) => (
              <li key={item.title} className="card">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-text">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-surface section-space">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-text">Two ways to search</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="card">
              <Banknote className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-semibold">Funding Scout</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Find loans, grants, accelerators and support programmes currently listed for
                Nigerian SMEs.
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>A Lagos retailer looking for working capital</li>
                <li>A food business checking grant windows before they close</li>
                <li>A founder comparing accelerator calls</li>
              </ul>
              <Link href="/funding" className="btn-primary mt-6">
                Open Funding Scout
              </Link>
            </article>
            <article className="card">
              <Store className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-semibold">Local Scout</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Find tailors, bakers, shoemakers, printers, packaging vendors and related services
                by location.
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>A resident looking for a tailor in Yaba</li>
                <li>Someone ordering cakes in Surulere</li>
                <li>A shop booking print work in Ikeja</li>
              </ul>
              <Link href="/vendors" className="btn-primary mt-6">
                Open Local Scout
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-text">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Tell us what you need',
                body: 'Choose funding or vendors, then add a keyword, category and location.',
              },
              {
                step: '2',
                title: 'Scouvela searches and organises results',
                body: 'Matching records are grouped, labelled and capped so the list stays usable.',
              },
              {
                step: '3',
                title: 'Review details and continue at the original source',
                body: 'Open the source link to confirm dates, eligibility and contact details before you apply or call.',
              },
            ].map((item) => (
              <li key={item.step} className="card">
                <p className="text-sm font-semibold text-primary">Step {item.step}</p>
                <h3 className="mt-2 font-semibold text-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-copy text-sm leading-6 text-muted">
            Scouvela does not submit applications or contact vendors for you. Independently confirm
            every detail before applying for funding or engaging a service provider.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-surface section-space">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-text">Built for trust and freshness</h2>
            <p className="mt-4 leading-7 text-muted">
              The useful part is not a longer list. It is knowing where a record came from, when it
              was found, and whether it still looks current.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              'Original source displayed on every card',
              'Discovery date displayed so freshness is visible',
              'Funding status labelled as Active, Closing Soon, Expired or Unverified',
              'Unverified information is named as unverified, never dressed up as confirmed',
            ].map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-border bg-background p-4 text-sm leading-6 text-text"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell card">
          <h2 className="text-2xl font-semibold text-text">Ready to search?</h2>
          <p className="mt-3 max-w-copy text-sm leading-6 text-muted">
            Look up SME funding or find a local vendor. Every result keeps its original source link.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/funding" className="btn-primary">
              Find Funding
            </Link>
            <Link href="/vendors" className="btn-secondary">
              Find Vendors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
