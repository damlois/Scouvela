import type { FundingOpportunity } from '@scouvela/shared';
import { Banknote } from 'lucide-react';
import { formatList } from '@/lib/utils';

export function FundingResultCard({ opportunity }: { opportunity: FundingOpportunity }) {
  return (
    <article className="rounded-md border border-teal/20 bg-white p-4">
      <div className="flex items-start gap-3">
        <Banknote className="mt-0.5 h-5 w-5 text-teal" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-charcoal">{opportunity.title}</h3>
          <p>
            {opportunity.provider} · {opportunity.fundingType} · {opportunity.status}
          </p>
          {opportunity.amount ? <p>Amount: {opportunity.amount}</p> : null}
          <p>Eligibility: {formatList(opportunity.eligibility)}</p>
          <p>
            Source:{' '}
            <a className="text-teal underline" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">
              {opportunity.sourceName}
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
