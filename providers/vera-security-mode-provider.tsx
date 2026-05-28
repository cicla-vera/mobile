import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { veraQueryKeys } from '@/hooks/vera/query-keys';
import { SecurityModeContext } from '@/providers/security-mode-context';
import { queryClient } from '@/services/query-client';
import {
  getSecurityModeSnapshot,
  processSecurityAudioCheckpoint,
  startSecurityMode,
  stopSecurityMode,
  subscribeSecurityMode,
  triggerSimulatedViolenceDetection,
} from '@/services/vera/security-audio-simulation.service';
import {
  ensureSecurityModeOverlayPermission,
  getSecurityModeOverlayPermission,
  getSecurityModeOverlayPermissionMessage,
  hideSecurityModeDiscreetOverlay,
  openSecurityModeOverlaySettings,
  promptSystemOverlayPermission,
  requestSecurityModeOverlayPermission,
  showSecurityModeDiscreetOverlay,
} from '@/services/vera/security-mode-overlay.service';
import {
  preloadSystemOverlayIcon,
  subscribeFloatingBubbleTap,
} from '@/services/vera/security-mode-system-overlay.service';
import { useVeraStore } from '@/stores/vera.store';
import type { SecurityModeSnapshot } from '@/types/vera-security-audio.types';

const CICLA_HOME_ROUTE = '/(exterior)' as const;

function routeToCiclaHome() {
  try {
    router.replace(CICLA_HOME_ROUTE);
  } catch {
    // Router may not be ready yet; AppState handler will retry on next focus.
  }
}

const defaultSnapshot: SecurityModeSnapshot = {
  status: 'idle',
  isActive: false,
  segmentStartedAt: null,
  postTriggerStartedAt: null,
  lastDetectedText: null,
  lastError: null,
  nextSimulatedTriggerAt: null,
  evidences: [],
};

type VeraSecurityModeProviderProps = {
  children: ReactNode;
};

export function VeraSecurityModeProvider({
  children,
}: VeraSecurityModeProviderProps) {
  const [snapshot, setSnapshot] = useState<SecurityModeSnapshot>(defaultSnapshot);
  const [isBusy, setIsBusy] = useState(false);
  const [overlayNotice, setOverlayNotice] = useState<string | null>(null);
  const isActiveRef = useRef(false);
  const evidenceCountRef = useRef(0);
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const activeAlertSessionId = useVeraStore(
    (state) => state.activeAlertSessionId,
  );

  useEffect(() => {
    isActiveRef.current = snapshot.isActive;
  }, [snapshot.isActive]);

  useEffect(() => {
    let active = true;

    void getSecurityModeSnapshot().then((initialSnapshot) => {
      if (active) {
        setSnapshot(initialSnapshot);
      }
    });

    const unsubscribe = subscribeSecurityMode((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (snapshot.evidences.length === evidenceCountRef.current) {
      return;
    }

    evidenceCountRef.current = snapshot.evidences.length;

    void queryClient.invalidateQueries({
      queryKey: veraQueryKeys.vaultEvidence(activeAlertSessionId),
    });
    void queryClient.invalidateQueries({
      queryKey: veraQueryKeys.vaultEvidence(null),
    });
  }, [activeAlertSessionId, snapshot.evidences.length]);

  const syncOverlayPermission = useCallback(async () => {
    const permission = await getSecurityModeOverlayPermission();
    setOverlayNotice(getSecurityModeOverlayPermissionMessage(permission));
    return permission;
  }, []);

  useEffect(() => {
    void syncOverlayPermission();
  }, [syncOverlayPermission]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void hideSecurityModeDiscreetOverlay();
        void syncOverlayPermission();
        void processSecurityAudioCheckpoint().then((nextSnapshot) => {
          setSnapshot(nextSnapshot);
        });
        return;
      }

      if (
        (nextState === 'background' || nextState === 'inactive') &&
        isActiveRef.current
      ) {
        routeToCiclaHome();
        setTimeout(lockVeraSession, 0);

        void showSecurityModeDiscreetOverlay().then((result) => {
          if (!result.shown && result.message) {
            setOverlayNotice(result.message);
          }
        });
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [lockVeraSession, syncOverlayPermission]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    preloadSystemOverlayIcon();

    const unsubscribe = subscribeFloatingBubbleTap(() => {
      void triggerSimulatedViolenceDetection().catch(() => undefined);
      routeToCiclaHome();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const nextSnapshot = await getSecurityModeSnapshot();
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, []);

  const requestOverlayPermission = useCallback(async () => {
    const permission = await requestSecurityModeOverlayPermission();
    const refreshed = await getSecurityModeOverlayPermission();
    setOverlayNotice(getSecurityModeOverlayPermissionMessage(refreshed));
    return refreshed.granted;
  }, []);

  const openOverlaySettings = useCallback(async () => {
    await openSecurityModeOverlaySettings();
  }, []);

  const prepareOverlayPermission = useCallback(async () => {
    let permission = await getSecurityModeOverlayPermission();

    if (permission.granted) {
      setOverlayNotice(null);
      return permission;
    }

    if (permission.usesSystemOverlay) {
      permission = await promptSystemOverlayPermission(permission);
    } else {
      permission = await ensureSecurityModeOverlayPermission();
    }

    const refreshed = await getSecurityModeOverlayPermission();
    setOverlayNotice(getSecurityModeOverlayPermissionMessage(refreshed));
    return refreshed;
  }, []);

  const start = useCallback(async () => {
    setIsBusy(true);

    try {
      await prepareOverlayPermission();

      const nextSnapshot = await startSecurityMode();
      setSnapshot(nextSnapshot);

      const effectivePermission = await getSecurityModeOverlayPermission();

      if (nextSnapshot.isActive) {
        if (!effectivePermission.granted) {
          setOverlayNotice(
            getSecurityModeOverlayPermissionMessage(effectivePermission),
          );
        } else if (AppState.currentState !== 'active') {
          const overlayResult = await showSecurityModeDiscreetOverlay();

          if (!overlayResult.shown && overlayResult.message) {
            setOverlayNotice(overlayResult.message);
          } else {
            setOverlayNotice(null);
          }
        } else {
          setOverlayNotice(null);
        }
      }

      return nextSnapshot;
    } finally {
      setIsBusy(false);
    }
  }, [prepareOverlayPermission]);

  const stop = useCallback(async () => {
    setIsBusy(true);

    try {
      const nextSnapshot = await stopSecurityMode();
      await hideSecurityModeDiscreetOverlay();
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const simulateTrigger = useCallback(async (customText?: string) => {
    setIsBusy(true);

    try {
      const nextSnapshot = await triggerSimulatedViolenceDetection(customText);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      isBusy,
      overlayNotice,
      refresh,
      start,
      stop,
      simulateTrigger,
      requestOverlayPermission,
      openOverlaySettings,
      syncOverlayPermission,
    }),
    [
      isBusy,
      openOverlaySettings,
      overlayNotice,
      refresh,
      requestOverlayPermission,
      simulateTrigger,
      snapshot,
      start,
      stop,
      syncOverlayPermission,
    ],
  );

  return (
    <SecurityModeContext.Provider value={value}>
      {children}
    </SecurityModeContext.Provider>
  );
}
