import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExternalSourceLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function ExternalSourceLink({ href, label, className }: ExternalSourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
      className={cn('btn-primary', className)}
    >
      {label}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}
