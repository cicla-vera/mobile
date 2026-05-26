import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/constants/theme';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { hasSeenOnboarding } from '@/services/onboarding-storage';

export default function IndexRoute() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [onboardingResolved, setOnboardingResolved] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isHydrated || isAuthenticated) {
      setOnboardingResolved(isAuthenticated);
      return;
    }

    setOnboardingResolved(false);

    void hasSeenOnboarding()
      .then((seen) => {
        if (active) {
          setOnboardingSeen(seen);
        }
      })
      .catch(() => {
        if (active) {
          setOnboardingSeen(false);
        }
      })
      .finally(() => {
        if (active) {
          setOnboardingResolved(true);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, isHydrated]);

  if (!isHydrated || !onboardingResolved) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (isVeraDemoModeEnabled) {
      return <Redirect href="/(interior)" />;
    }

    return <Redirect href="/(exterior)" />;
  }

  return <Redirect href={onboardingSeen ? '/login' : '/welcome'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
});
