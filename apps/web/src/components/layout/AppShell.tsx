'use client';

import type { ReactNode } from 'react';
import { AudienceEntry } from '@/components/audience/AudienceEntry';
import { AudienceProvider, useAudience } from '@/components/audience/AudienceProvider';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

function AppFrame({ children }: { children: ReactNode }) {
  const { ready, userType } = useAudience();

  if (!ready || userType === null) {
    return <AudienceEntry />;
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AudienceProvider>
      <AppFrame>{children}</AppFrame>
    </AudienceProvider>
  );
}
