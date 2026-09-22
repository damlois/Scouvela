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
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-md space-y-4">
          <Logo href="/" />
          <p className="text-sm leading-6 text-muted">
            {isBusiness
              ? 'Scouvela helps business owners in Nigeria find publicly listed SME funding and local service providers, with the original source attached to every result.'
              : 'Scouvela helps anyone in Nigeria find local service providers such as tailors, bakers, printers and photographers, with the original source attached to every result.'}
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-wide text-text">Explore</p>
          <ul className="mt-4 space-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text">Good to know</p>
          <p className="mt-4 text-sm text-muted">
            Listings are source-linked, not independently verified.
          </p>
          {userType ? (
            <div className="mt-5">
              <AudienceSwitch />
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-shell flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Scouvela. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              Built with Apify
            </span>
            She Code Africa × Apify Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
}
