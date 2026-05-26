import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import {
  useActiveAlertSessionQuery,
  useActiveSafetyLocationsQuery,
  useStartLocationAlertSessionMutation,
  useVeraProfileQuery,
} from '@/hooks/vera';
import {
  getVeraLocationMatch,
  startVeraBackgroundLocationUpdates,
  stopVeraBackgroundLocationUpdates,
  subscribeVeraBackgroundLocationUpdates,
  watchVeraForegroundLocation,
  type VeraLocationSample,
} from '@/services/vera';
import { useAuthStore } from '@/stores/auth.store';
import { useVeraStore } from '@/stores/vera.store';

type VeraLocationMonitorProviderProps = {
  children: ReactNode;
};

const LOCATION_ALERT_ATTEMPT_COOLDOWN_MS = 60 * 1000;

export function VeraLocationMonitorProvider({
  children,
}: VeraLocationMonitorProviderProps) {
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeAlertSessionId = useVeraStore(
    (state) => state.activeAlertSessionId,
  );
  const profileQuery = useVeraProfileQuery();
  const activeLocationsQuery = useActiveSafetyLocationsQuery();
  const activeAlertQuery = useActiveAlertSessionQuery();
  const {
    isPending: isStartingLocationAlert,
    mutate: startLocationAlert,
  } = useStartLocationAlertSessionMutation();
  const lastLocationAttemptRef = useRef<Record<string, number>>({});
  const isStartingLocationAlertRef = useRef(false);

  const riskLocations = useMemo(
    () =>
      (activeLocationsQuery.data ?? []).filter(
        (location) => location.enabled && location.type === 'RISK',
      ),
    [activeLocationsQuery.data],
  );
  const activeSyncedAlertSessionId =
    activeAlertQuery.data?.id ?? activeAlertSessionId;
  const shouldMonitor =
    isAuthHydrated &&
    isAuthenticated &&
    profileQuery.data?.consentAccepted === true &&
    profileQuery.data?.veraEnabled === true &&
    profileQuery.data?.monitoringEnabled === true;

  useEffect(() => {
    isStartingLocationAlertRef.current = isStartingLocationAlert;
  }, [isStartingLocationAlert]);

  useEffect(() => {
    if (!isAuthHydrated || !isAuthenticated || !shouldMonitor) {
      void stopVeraBackgroundLocationUpdates();
      return;
    }

    if (riskLocations.length === 0) {
      void stopVeraBackgroundLocationUpdates();
      return;
    }

    let disposed = false;
    let foregroundSubscription: { remove: () => void } | null = null;
    let unsubscribeBackground: (() => void) | null = null;

    function handleLocationSample(
      sample: VeraLocationSample,
      source: 'background' | 'foreground',
    ) {
      if (disposed || activeSyncedAlertSessionId) {
        return;
      }

      const match = getVeraLocationMatch(sample, riskLocations);

      if (!match || isStartingLocationAlertRef.current) {
        return;
      }

      const lastAttemptAt =
        lastLocationAttemptRef.current[match.location.id] ?? 0;

      if (Date.now() - lastAttemptAt < LOCATION_ALERT_ATTEMPT_COOLDOWN_MS) {
        return;
      }

      lastLocationAttemptRef.current[match.location.id] = Date.now();
      startLocationAlert({
        currentLatitude: sample.latitude,
        currentLongitude: sample.longitude,
        message: `Entrada detectada por ${source}: ${match.location.name}`,
        safetyLocationId: match.location.id,
      });
    }

    unsubscribeBackground = subscribeVeraBackgroundLocationUpdates((sample) => {
      handleLocationSample(sample, 'background');
    });

    void watchVeraForegroundLocation((sample) => {
      handleLocationSample(sample, 'foreground');
    }).then((subscription) => {
      if (disposed) {
        subscription?.remove();
        return;
      }

      foregroundSubscription = subscription;
    });

    void startVeraBackgroundLocationUpdates();

    return () => {
      disposed = true;
      foregroundSubscription?.remove();
      unsubscribeBackground?.();
      void stopVeraBackgroundLocationUpdates();
    };
  }, [
    activeSyncedAlertSessionId,
    isAuthHydrated,
    isAuthenticated,
    riskLocations,
    shouldMonitor,
    startLocationAlert,
  ]);

  return <>{children}</>;
}
