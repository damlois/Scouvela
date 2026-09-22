import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ExternalSourceLinkProps = {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
};

export function ExternalSourceLink({
  href,
  label,
  variant = 'primary',
  className,
}: ExternalSourceLinkProps) {
  return (
    <Button
      href={href}
      variant={variant}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
      className={className}
    >
      {label}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
