import type { VendorVerificationStatus } from '@scouvela/shared';
import { CircleCheck, ShieldQuestion } from 'lucide-react';
import { VERIFICATION_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const statusStyles: Record<VendorVerificationStatus, { className: string; icon: typeof CircleCheck; title: string }> = {
  'source-listed': {
    className: 'border-success/30 bg-success/10 text-success',
    icon: CircleCheck,
    title: 'Found on a public listing site. Not independently verified by Scouvela.',
  },
  unverified: {
    className: 'border-dashed border-muted/50 bg-transparent text-muted',
    icon: ShieldQuestion,
    title: 'Could not be confirmed against a public listing. Not independently verified by Scouvela.',
  },
};

export function VendorStatusBadge({ status }: { status: VendorVerificationStatus }) {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <span
      title={config.title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {VERIFICATION_LABELS[status]}
    </span>
  );
}
