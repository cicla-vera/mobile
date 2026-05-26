import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { colors, radius, spacing } from '@/constants/theme';

export function VeraDemoBanner() {
  if (!isVeraDemoModeEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Feather name="monitor" size={20} color={colors.ink} />
      <View style={styles.copy}>
        <AppText variant="label">Modo demo</AppText>
        <AppText variant="caption" tone="muted">
          Dados ficticios para apresentacao.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: spacing[6],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
});
