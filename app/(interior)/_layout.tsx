import { Redirect, Stack } from 'expo-router';

import { isVeraSessionValid, useVeraStore } from '@/stores/vera.store';

export default function InteriorLayout() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const hasValidSession = isVeraSessionValid({
    isUnlocked,
    sessionExpiresAt,
    veraSessionToken,
  });

  if (!hasValidSession) {
    return <Redirect href="/(exterior)/vera-unlock" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
