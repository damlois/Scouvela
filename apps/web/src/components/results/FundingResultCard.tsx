import type { FundingOpportunity } from '@scouvela/shared';
import { MapPin } from 'lucide-react';
import { ExternalSourceLink } from '@/components/results/ExternalSourceLink';
import { StatusBadge } from '@/components/results/StatusBadge';
import { formatDate, formatFundingType, formatList, cn } from '@/lib/utils';

export function FundingResultCard({ opportunity }: { opportunity: FundingOpportunity }) {
  const expired = opportunity.status === 'expired';

  return (
    <article
      className={cn('card flex h-full flex-col gap-4', expired && 'bg-background text-muted')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {formatFundingType(opportunity.fundingType)}
          </p>
          <h3 className="text-lg font-semibold text-text break-words">{opportunity.title}</h3>
          <p className="text-sm text-muted">{opportunity.provider}</p>
        </div>
        <StatusBadge status={opportunity.status} />
      </div>

      {expired ? (
        <p className="text-sm text-muted">
          This opportunity is listed as expired and is not a current call.
        </p>
      ) : null}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-text">Amount</dt>
          <dd className="mt-1 text-muted">{opportunity.amount ?? 'Not published'}</dd>
        </div>
        <div>
          <dt className="font-medium text-text">Deadline</dt>
          <dd className="mt-1 text-muted">
            {opportunity.deadline ? formatDate(opportunity.deadline) : 'Not published'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-text">Eligibility</dt>
          <dd className="mt-1 text-muted">{formatList(opportunity.eligibility)}</dd>
        </div>
      </dl>

      {opportunity.description ? (
        <p className="text-sm leading-6 text-muted">{opportunity.description}</p>
      ) : (
        <p className="text-sm text-muted">No public summary was included with this listing.</p>
      )}

      <div className="mt-auto space-y-3 border-t border-border pt-4 text-sm">
        <p className="flex items-start gap-2 text-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{opportunity.location ?? 'Location not specified'}</span>
        </p>
        <p className="break-words text-muted">
          Source: {opportunity.sourceName}. Discovered {formatDate(opportunity.discoveredAt)}.
        </p>
        <ExternalSourceLink href={opportunity.sourceUrl} label="View original opportunity" />
      </div>
    </article>
  );
}
