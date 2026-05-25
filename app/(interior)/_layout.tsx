import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { clearStoredVeraBiometricSession } from '@/services/vera';
import { isVeraSessionValid, useVeraStore } from '@/stores/vera.store';

export default function InteriorLayout() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const hasValidSession = isVeraSessionValid({
    isUnlocked,
    sessionExpiresAt,
    veraSessionToken,
  });

  useEffect(() => {
    if (!sessionExpiresAt) {
      return;
    }

    const sessionTimeLeft = new Date(sessionExpiresAt).getTime() - Date.now();

    if (sessionTimeLeft <= 0) {
      lockVeraSession();
      void clearStoredVeraBiometricSession();
      return;
    }

    const timeout = setTimeout(() => {
      lockVeraSession();
      void clearStoredVeraBiometricSession();
    }, sessionTimeLeft);

    return () => clearTimeout(timeout);
  }, [lockVeraSession, sessionExpiresAt]);

  if (!hasValidSession) {
    return <Redirect href="/(exterior)/vera-unlock" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
