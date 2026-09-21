'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type UserType } from '@/lib/user-type';

type AudienceContextValue = {
  ready: boolean;
  userType: UserType | null;
  isBusiness: boolean;
  setUserType: (type: UserType) => void;
  resetUserType: () => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function useAudience(): AudienceContextValue {
  const value = useContext(AudienceContext);
  if (!value) {
    throw new Error('useAudience must be used within AudienceProvider.');
  }

  return value;
}

export function AudienceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserTypeState] = useState<UserType | null>(null);

  const setUserType = useCallback(
    (type: UserType) => {
      setUserTypeState(type);

      if (type === 'individual' && pathname.startsWith('/funding')) {
        router.replace('/vendors');
      }
    },
    [pathname, router],
  );

  const resetUserType = useCallback(() => {
    setUserTypeState(null);
  }, []);

  const value = useMemo(
    () => ({
      ready: true,
      userType,
      isBusiness: userType !== 'individual',
      setUserType,
      resetUserType,
    }),
    [resetUserType, setUserType, userType],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}
