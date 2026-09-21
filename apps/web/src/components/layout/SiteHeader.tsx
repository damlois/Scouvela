import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/funding', label: 'Funding' },
  { href: '/vendors', label: 'Vendors' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-teal/20 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-teal">
          Scouvela
        </Link>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-charcoal hover:text-teal">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
