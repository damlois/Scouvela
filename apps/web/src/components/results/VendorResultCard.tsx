import type { Vendor } from '@scouvela/shared';
import { Store } from 'lucide-react';

export function VendorResultCard({ vendor }: { vendor: Vendor }) {
  return (
    <article className="rounded-md border border-teal/20 bg-white p-4">
      <div className="flex items-start gap-3">
        <Store className="mt-0.5 h-5 w-5 text-teal" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-charcoal">{vendor.name}</h3>
          <p>
            {vendor.category} · {vendor.locality ? `${vendor.locality}, ` : ''}
            {vendor.state}
          </p>
          <p>Listing status: {vendor.verificationStatus}</p>
          <p>
            Source:{' '}
            <a className="text-teal underline" href={vendor.sourceUrl} target="_blank" rel="noreferrer">
              {vendor.sourceName}
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
