import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EyebrowTone = 'primary' | 'inverted';

const toneClasses: Record<EyebrowTone, string> = {
  primary: 'border-primary/20 bg-primary/10 text-primary',
  inverted: 'border-white/25 bg-white/10 text-white',
};

type EyebrowProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: EyebrowTone;
  uppercase?: boolean;
  className?: string;
};

export function Eyebrow({
  children,
  icon,
  tone = 'primary',
  uppercase = true,
  className,
}: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold',
        uppercase ? 'text-xs uppercase tracking-wide' : 'text-sm',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
