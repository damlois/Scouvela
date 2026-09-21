'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AudienceSwitch } from '@/components/audience/AudienceSwitch';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Logo } from '@/components/layout/Logo';
import { defaultSearchPath } from '@/lib/user-type';
import { cn } from '@/lib/utils';

const allLinks = [
  { href: '/', label: 'Home' },
  { href: '/funding', label: 'Find Funding' },
  { href: '/vendors', label: 'Find Vendors' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const { isBusiness, userType } = useAudience();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const links = isBusiness ? allLinks : allLinks.filter((link) => link.href !== '/funding');
  const searchHref = defaultSearchPath(userType);
  const searchLabel = isBusiness ? 'Start searching' : 'Find a vendor';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <div className="container-shell flex min-h-16 items-center justify-between gap-3 py-3">
        <Logo priority />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-primary',
                isActive(pathname, link.href) && 'bg-background text-primary',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <AudienceSwitch />
          </div>
          <Link href={searchHref} className="btn-primary hidden shrink-0 lg:inline-flex">
            {searchLabel}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>
      {!open ? (
        <div className="border-t border-border bg-background sm:hidden">
          <div className="container-shell py-2">
            <AudienceSwitch variant="menu" />
          </div>
        </div>
      ) : null}
      {open ? (
        <div id={menuId} className="border-t border-border bg-surface lg:hidden">
          <nav aria-label="Mobile" className="container-shell flex flex-col gap-1 py-4">
            <div className="mb-3 sm:hidden">
              <AudienceSwitch variant="menu" />
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-3 text-base font-medium text-text',
                  isActive(pathname, link.href) && 'bg-background text-primary',
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href={searchHref} className="btn-primary mt-2" onClick={() => setOpen(false)}>
              {searchLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
