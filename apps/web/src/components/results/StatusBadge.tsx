import type { FundingStatus } from '@scouvela/shared';
import { CircleAlert, CircleCheck, Clock3, MinusCircle } from 'lucide-react';
import { FUNDING_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const statusStyles: Record<FundingStatus, { className: string; icon: typeof CircleCheck }> = {
  active: {
    className: 'border-success/30 bg-success/10 text-success',
    icon: CircleCheck,
  },
  'closing-soon': {
    className: 'border-accent/40 bg-accent/15 text-text',
    icon: Clock3,
  },
  expired: {
    className: 'border-border bg-background text-muted',
    icon: MinusCircle,
  },
  unverified: {
    className: 'border-dashed border-muted/50 bg-transparent text-muted',
    icon: CircleAlert,
  },
};

export function StatusBadge({ status }: { status: FundingStatus }) {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {FUNDING_STATUS_LABELS[status]}
    </span>
  );
}
