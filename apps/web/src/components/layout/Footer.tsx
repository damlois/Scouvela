'use client';

import Link from 'next/link';
import { AudienceSwitch } from '@/components/audience/AudienceSwitch';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Logo } from '@/components/layout/Logo';

export function Footer() {
  const year = new Date().getFullYear();
  const { isBusiness, userType } = useAudience();
  const footerLinks = [
    { href: '/', label: 'Home' },
    ...(isBusiness ? [{ href: '/funding', label: 'Find Funding' }] : []),
    { href: '/vendors', label: 'Find Vendors' },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-md space-y-3">
          <Logo href="/" />
          <p className="text-sm leading-6 text-muted">
            {isBusiness
              ? 'Scouvela helps business owners in Nigeria find publicly listed SME funding and local service providers, with the original source attached to every result.'
              : 'Scouvela helps anyone in Nigeria find local service providers such as tailors, bakers, printers and photographers, with the original source attached to every result.'}
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold text-text">Explore</p>
          <ul className="mt-3 space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container-shell flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Built with Apify for the She Code Africa × Apify Hackathon</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {userType ? <AudienceSwitch /> : null}
            <span>© {year} Scouvela. Listings are source-linked, not independently verified.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
