import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: {
    default: 'Scouvela',
    template: '%s · Scouvela',
  },
  description:
    'Find SME funding if you run a business, or find local vendors in Nigeria whether you do or not.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/images/scouvela-mark.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} flex min-h-screen flex-col font-sans antialiased`}
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
