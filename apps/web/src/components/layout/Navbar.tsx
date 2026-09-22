'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AudienceSwitch } from '@/components/audience/AudienceSwitch';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
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

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  variant: 'desktop' | 'mobile';
  onClick?: () => void;
};

function NavLink({ href, label, active, variant, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-md font-medium transition-colors',
        variant === 'desktop' ? 'px-3 py-2 text-sm text-muted' : 'px-3 py-3 text-base text-text',
        active ? 'bg-background text-primary' : 'hover:bg-background/60 hover:text-primary',
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { isBusiness, userType } = useAudience();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const links = isBusiness ? allLinks : allLinks.filter((link) => link.href !== '/funding');
  const searchHref = defaultSearchPath(userType);
  const searchLabel = isBusiness ? 'Start searching' : 'Find a vendor';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-surface/75',
        scrolled && 'shadow-sm',
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <div className="container-shell flex min-h-16 items-center justify-between gap-3 py-3">
        <Logo priority className="transition-transform duration-200 hover:scale-[1.03]" />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
              variant="desktop"
            />
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <AudienceSwitch />
          </div>
          <Button
            href={searchHref}
            className="hidden shrink-0 transition-transform lg:inline-flex hover:-translate-y-0.5"
          >
            {searchLabel}
          </Button>
          <button
            type="button"
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border transition-colors hover:border-primary hover:text-primary lg:hidden',
              open && 'border-primary bg-background text-primary',
            )}
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
        <div
          id={menuId}
          className="animate-slide-down border-t border-border bg-surface lg:hidden"
        >
          <nav aria-label="Mobile" className="container-shell flex flex-col gap-1 py-4">
            <div className="mb-3 sm:hidden">
              <AudienceSwitch variant="menu" />
            </div>
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isActive(pathname, link.href)}
                variant="mobile"
                onClick={() => setOpen(false)}
              />
            ))}
            <Button href={searchHref} className="mt-2" onClick={() => setOpen(false)}>
              {searchLabel}
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
