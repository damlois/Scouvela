import type { FundingOpportunity } from '@scouvela/shared';
import { Banknote, Building2, CalendarClock, Link2, MapPin } from 'lucide-react';
import { ExternalSourceLink } from '@/components/results/ExternalSourceLink';
import { StatusBadge } from '@/components/results/StatusBadge';
import {
  cn,
  formatDate,
  formatDaysLeft,
  formatFundingType,
  formatRelativeTime,
} from '@/lib/utils';

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-text">{value}</dd>
    </div>
  );
}

export function FundingResultCard({ opportunity }: { opportunity: FundingOpportunity }) {
  const expired = opportunity.status === 'expired';
  const eligibility = opportunity.eligibility ?? [];
  const daysLeft = !expired && opportunity.deadline ? formatDaysLeft(opportunity.deadline) : null;

  return (
    <article
      className={cn(
        'card group flex h-full flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        expired && 'opacity-80',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {formatFundingType(opportunity.fundingType)}
        </span>
        <StatusBadge status={opportunity.status} />
      </div>

      <div className="min-w-0 space-y-1.5">
        <h3 className="break-words text-lg font-semibold leading-snug text-text">
          {opportunity.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {opportunity.provider}
        </p>
      </div>

      {expired ? (
        <p className="rounded-md bg-background px-3 py-2 text-sm text-muted">
          This opportunity is listed as expired and is not a current call.
        </p>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact icon={Banknote} label="Amount" value={opportunity.amount ?? 'Not published'} />
        <Fact
          icon={CalendarClock}
          label="Deadline"
          value={
            opportunity.deadline
              ? `${formatDate(opportunity.deadline)}${daysLeft ? ` · ${daysLeft}` : ''}`
              : 'Not published'
          }
        />
      </dl>

      <p className="text-sm leading-6 text-muted">
        {opportunity.description ?? 'No public summary was included with this listing.'}
      </p>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Eligibility</p>
        {eligibility.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {eligibility.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">Not specified</p>
        )}
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4 text-sm">
        <p className="flex items-start gap-2 text-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{opportunity.location ?? 'Location not specified'}</span>
        </p>
        <p className="flex items-center gap-1.5 break-words text-sm font-semibold text-text">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          {opportunity.sourceName}
        </p>
        <p className="text-xs text-muted">{formatRelativeTime(opportunity.discoveredAt)}</p>
        <ExternalSourceLink href={opportunity.sourceUrl} label="View original opportunity" />
      </div>
    </article>
  );
}
