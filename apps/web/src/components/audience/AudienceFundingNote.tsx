'use client';

import Link from 'next/link';
import { useAudience } from '@/components/audience/AudienceProvider';

export function AudienceFundingNote() {
  const { isBusiness } = useAudience();

  if (isBusiness) {
    return null;
  }

  return (
    <p className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted">
      This funding search is aimed at business owners.{' '}
      <Link href="/vendors" className="font-semibold text-primary">
        Find a local vendor instead
      </Link>
      .
    </p>
  );
}
