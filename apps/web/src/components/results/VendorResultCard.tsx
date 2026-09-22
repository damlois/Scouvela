import type { Vendor } from '@scouvela/shared';
import { Globe, MapPin, Phone, Star } from 'lucide-react';
import { ExternalSourceLink } from '@/components/results/ExternalSourceLink';
import { VendorStatusBadge } from '@/components/results/VendorStatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDomain, formatRelativeTime, formatServiceCategory, getInitials } from '@/lib/utils';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96S17.55 2 12.05 2Zm5.86 14.24c-.25.7-1.24 1.3-2 1.46-.53.11-1.22.2-3.55-.76-2.98-1.23-4.9-4.24-5.05-4.44-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.66.5.25.6.86 2.08.93 2.23.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 2 .95.3.15.5.22.57.35.08.13.08.75-.17 1.44Z" />
    </svg>
  );
}

export function VendorResultCard({ vendor }: { vendor: Vendor }) {
  const addressLine = vendor.address ?? [vendor.locality, vendor.state].filter(Boolean).join(', ');
  const whatsappDigits = vendor.phone?.replace(/[^0-9]/g, '');

  return (
    <article className="card group flex h-full flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(vendor.name)}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {formatServiceCategory(vendor.category)}
            </p>
            <h3 className="break-words text-lg font-semibold leading-snug text-text">
              {vendor.name}
            </h3>
          </div>
        </div>
        <VendorStatusBadge status={vendor.verificationStatus} />
      </div>

      {addressLine ? (
        <p className="flex items-start gap-1.5 text-sm text-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="break-words">{addressLine}</span>
        </p>
      ) : null}

      {vendor.description ? (
        <p className="text-sm leading-6 text-muted">{vendor.description}</p>
      ) : null}

      <ul className="space-y-2.5 text-sm">
        {vendor.website ? (
          <li className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
              aria-label={`Visit website for ${vendor.name} (opens in a new tab)`}
            >
              {formatDomain(vendor.website)}
            </a>
          </li>
        ) : null}
        {vendor.rating !== undefined ? (
          <li className="flex items-start gap-2 text-muted">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-text">{vendor.rating.toFixed(1)}</strong>{' '}
              · X reviews on {vendor.sourceName}
            </span>
          </li>
        ) : null}
      </ul>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2">
          {vendor.phone ? (
            <Button href={`tel:${vendor.phone.replace(/\s+/g, '')}`} className="flex-1">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </Button>
          ) : null}
          {whatsappDigits ? (
            <Button
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </Button>
          ) : null}
        </div>
        <ExternalSourceLink
          href={vendor.sourceUrl}
          label="View original listing"
          variant="secondary"
          className="w-full"
        />
        <p className="text-xs text-muted">
          Source: {vendor.sourceName} · {formatRelativeTime(vendor.discoveredAt)}
        </p>
      </div>
    </article>
  );
}
