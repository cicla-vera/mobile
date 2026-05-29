import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/constants/theme';
import { isVeraDemoModeEnabled } from '@/constants/demo';

export default function IndexRoute() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isHydrated) {
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

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
});
