import { useEffect, useRef, type ReactNode } from 'react';

import { useActiveAlertSessionQuery, useVeraProfileQuery } from '@/hooks/vera';
import {
  cancelVeraActiveAlertNotification,
  syncVeraActiveAlertNotification,
} from '@/services/local-notifications.service';
import { useAuthStore } from '@/stores/auth.store';
import { useVeraStore } from '@/stores/vera.store';

type VeraActiveAlertProviderProps = {
  children: ReactNode;
};

export function VeraActiveAlertProvider({
  children,
}: VeraActiveAlertProviderProps) {
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeAlertSessionId = useVeraStore(
    (state) => state.activeAlertSessionId,
  );
  const clearActiveAlertSession = useVeraStore(
    (state) => state.clearActiveAlertSession,
  );
  const hydrateActiveAlertSession = useVeraStore(
    (state) => state.hydrateActiveAlertSession,
  );
  const isActiveAlertHydrated = useVeraStore(
    (state) => state.isActiveAlertHydrated,
  );
  const setActiveAlertSessionId = useVeraStore(
    (state) => state.setActiveAlertSessionId,
  );
  const activeAlertQuery = useActiveAlertSessionQuery();
  const profileQuery = useVeraProfileQuery();
  const notifiedSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthHydrated) {
      return;
    }

    if (!isAuthenticated) {
      notifiedSessionIdRef.current = null;
      clearActiveAlertSession();
      void cancelVeraActiveAlertNotification();
      return;
    }

    if (!isActiveAlertHydrated) {
      void hydrateActiveAlertSession();
    }
  }, [
    clearActiveAlertSession,
    hydrateActiveAlertSession,
    isActiveAlertHydrated,
    isAuthHydrated,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (!isAuthenticated || activeAlertQuery.data === undefined) {
      return;
    }

    if (activeAlertQuery.data?.id) {
      setActiveAlertSessionId(activeAlertQuery.data.id);
      return;
    }

    setActiveAlertSessionId(null);
  }, [activeAlertQuery.data, isAuthenticated, setActiveAlertSessionId]);

  useEffect(() => {
    if (!isAuthHydrated || !isAuthenticated) {
      return;
    }

    const syncedAlertSessionId =
      activeAlertQuery.data?.id ?? activeAlertSessionId;
    const discreetNotificationsEnabled =
      profileQuery.data?.discreetNotificationsEnabled === true;

    if (!syncedAlertSessionId || !discreetNotificationsEnabled) {
      notifiedSessionIdRef.current = null;
      void cancelVeraActiveAlertNotification();
      return;
    }

    if (notifiedSessionIdRef.current === syncedAlertSessionId) {
      return;
    }

    notifiedSessionIdRef.current = syncedAlertSessionId;
    void syncVeraActiveAlertNotification({
      alertSessionId: syncedAlertSessionId,
      enabled: discreetNotificationsEnabled,
    });
  }, [
    activeAlertQuery.data,
    activeAlertSessionId,
    isAuthHydrated,
    isAuthenticated,
    profileQuery.data,
  ]);

  return <>{children}</>;
}
