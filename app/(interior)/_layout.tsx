import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useVeraProfileQuery } from '@/hooks/vera';
import { clearStoredVeraBiometricSession } from '@/services/vera';
import { isVeraSessionValid, useVeraStore } from '@/stores/vera.store';

export default function InteriorLayout() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const profileQuery = useVeraProfileQuery();
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

  if (profileQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.coral} size="large" />
      </View>
    );
  }

  if (profileQuery.isError || !profileQuery.data?.consentAccepted) {
    return <Redirect href="/(exterior)/vera-consent" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
});
