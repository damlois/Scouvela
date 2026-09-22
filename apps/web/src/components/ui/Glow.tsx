import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlowLayer({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {children}
    </div>
  );
}

export function Glow({ className }: { className: string }) {
  return <div className={cn('absolute rounded-full blur-3xl', className)} />;
}
