import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { SECURITY_MODE_DISCREET_COPY } from '@/constants/security-mode-overlay';
import { colors, radius, spacing } from '@/constants/theme';
import { useSecurityMode } from '@/hooks/vera/useSecurityMode';

export function SecurityModeDiscreetBanner() {
  const insets = useSafeAreaInsets();
  const { snapshot } = useSecurityMode();
  const [appState, setAppState] = useState(AppState.currentState);
  const shouldShow =
    snapshot.isActive &&
    appState === 'active' &&
    Platform.OS !== 'web';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing[2] }]}
    >
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Feather name="calendar" size={16} color={colors.blue} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" tone="ink" style={styles.title}>
            {SECURITY_MODE_DISCREET_COPY.title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {SECURITY_MODE_DISCREET_COPY.banner}
          </AppText>
        </View>
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 999,
    elevation: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.12)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 247, 242, 0.96)',
    shadowColor: '#141011',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },
});
