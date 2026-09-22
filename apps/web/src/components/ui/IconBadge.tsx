import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconBadgeSize = 'md' | 'lg';
type IconBadgeShape = 'square' | 'circle';
type IconBadgeTone = 'tint' | 'solid';

const sizeClasses: Record<IconBadgeSize, string> = {
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

const toneClasses: Record<IconBadgeTone, string> = {
  tint: 'bg-primary/10 text-primary',
  solid: 'bg-primary text-white shadow-sm',
};

type IconBadgeProps = {
  icon: ReactNode;
  size?: IconBadgeSize;
  shape?: IconBadgeShape;
  tone?: IconBadgeTone;
  className?: string;
};

export function IconBadge({
  icon,
  size = 'md',
  shape = 'square',
  tone = 'tint',
  className,
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        sizeClasses[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
    </span>
  );
}
