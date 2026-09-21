import Link from 'next/link';
import { Banknote, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-amber">Placeholder landing page</p>
        <h1 className="mt-2 text-3xl font-semibold text-teal">Scouvela</h1>
        <p className="mt-3 max-w-2xl text-charcoal">
          An Apify-powered discovery platform that helps Nigerian entrepreneurs find SME funding
          opportunities and local service providers.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/funding" className="rounded-md border border-teal/20 bg-white p-5">
          <Banknote className="h-5 w-5 text-teal" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Funding search</h2>
          <p className="mt-1 text-sm text-charcoal/80">Loans, grants, accelerators and support programmes.</p>
        </Link>
        <Link href="/vendors" className="rounded-md border border-teal/20 bg-white p-5">
          <Store className="h-5 w-5 text-teal" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Vendor search</h2>
          <p className="mt-1 text-sm text-charcoal/80">
            Tailors, bakers, shoemakers, printers and packaging vendors by location.
          </p>
        </Link>
      </div>
    </section>
  );
}
