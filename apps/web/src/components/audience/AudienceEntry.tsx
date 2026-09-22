'use client';

import { useId } from 'react';
import { useAudience } from '@/components/audience/AudienceProvider';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';

export function AudienceEntry() {
  const { ready, setUserType } = useAudience();
  const titleId = useId();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Logo href={null} size="hero" priority />
          {ready ? (
            <>
              <h1
                id={titleId}
                className="mt-10 text-2xl font-semibold tracking-tight text-text sm:text-3xl"
              >
                Are you a business owner?
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted sm:text-base">
                We’ll show funding tools if you run a business, or local vendors if you just need a
                service nearby.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3">
                <Button className="w-full" onClick={() => setUserType('business')}>
                  Yes, I run a business
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setUserType('individual')}
                >
                  No, I just need a local service
                </Button>
              </div>
            </>
          ) : (
            <p className="sr-only">Loading Scouvela</p>
          )}
        </div>
      </main>
    </div>
  );
}
