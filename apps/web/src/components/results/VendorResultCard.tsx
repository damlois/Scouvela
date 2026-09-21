import type { Vendor } from '@scouvela/shared';
import { CircleAlert, MapPin, Phone, Star } from 'lucide-react';
import { ExternalSourceLink } from '@/components/results/ExternalSourceLink';
import { VERIFICATION_LABELS } from '@/lib/constants';
import { formatDate, formatServiceCategory } from '@/lib/utils';

export function VendorResultCard({ vendor }: { vendor: Vendor }) {
  const verificationLabel = VERIFICATION_LABELS[vendor.verificationStatus];

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {formatServiceCategory(vendor.category)}
          </p>
          <h3 className="text-lg font-semibold text-text break-words">{vendor.name}</h3>
          <p className="flex items-start gap-2 text-sm text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {vendor.locality ? `${vendor.locality}, ` : ''}
              {vendor.state}
            </span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {verificationLabel}
        </span>
      </div>

      {vendor.description ? (
        <p className="text-sm leading-6 text-muted">{vendor.description}</p>
      ) : null}

      <dl className="grid gap-3 text-sm">
        {vendor.address ? (
          <div>
            <dt className="font-medium text-text">Address</dt>
            <dd className="mt-1 break-words text-muted">{vendor.address}</dd>
          </div>
        ) : null}
        {vendor.phone ? (
          <div>
            <dt className="font-medium text-text">Phone</dt>
            <dd className="mt-1">
              <a
                href={`tel:${vendor.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {vendor.phone}
              </a>
            </dd>
          </div>
        ) : null}
        {vendor.website ? (
          <div>
            <dt className="font-medium text-text">Website</dt>
            <dd className="mt-1 break-all">
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
                aria-label={`Visit website for ${vendor.name} (opens in a new tab)`}
              >
                {vendor.website.replace('https://', '')}
              </a>
            </dd>
          </div>
        ) : null}
        {vendor.rating !== undefined ? (
          <div>
            <dt className="font-medium text-text">Listed rating</dt>
            <dd className="mt-1 flex items-center gap-2 text-muted">
              <Star className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>
                {vendor.rating.toFixed(1)} out of 5, as published by the source. Not a Scouvela
                verification.
              </span>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto space-y-3 border-t border-border pt-4 text-sm">
        <p className="break-words text-muted">
          Source: {vendor.sourceName}. Discovered {formatDate(vendor.discoveredAt)}. This listing is{' '}
          {verificationLabel.toLowerCase()}, not independently verified.
        </p>
        <ExternalSourceLink href={vendor.sourceUrl} label="View original listing" />
      </div>
    </article>
  );
}
