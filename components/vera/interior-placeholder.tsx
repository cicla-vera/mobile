import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { VaultHeader, VaultScrollScreen } from '@/components/vera/vault-layout';
import { veraTheme } from '@/constants/vera-theme';
import { colors, radius, spacing } from '@/constants/theme';

type InteriorPlaceholderProps = {
  title: string;
  subtitle?: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
};

export function InteriorPlaceholder({
  title,
  subtitle,
  detail,
  icon,
}: InteriorPlaceholderProps) {
  return (
    <VaultScrollScreen contentContainerStyle={styles.content}>
      <VaultHeader title={title} subtitle={subtitle} />

      <View style={styles.panel}>
        <View style={styles.mark}>
          <Feather name={icon} size={24} color={colors.ink} />
        </View>
        <AppText style={styles.detail}>{detail}</AppText>
      </View>
    </VaultScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    minHeight: 280,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  mark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  detail: {
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: veraTheme.mutedText,
  },
});
