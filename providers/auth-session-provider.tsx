import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/stores/auth.store';

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return isHydrated ? children : null;
}
