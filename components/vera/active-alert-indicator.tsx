import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { veraTheme } from '@/constants/vera-theme';
import { colors, radius, spacing } from '@/constants/theme';
import { getHasValidVeraSession, useVeraStore } from '@/stores/vera.store';

type ActiveAlertIndicatorProps = {
  style?: StyleProp<ViewStyle>;
  variant: 'exterior' | 'interior';
};

export function ActiveAlertIndicator({
  style,
  variant,
}: ActiveAlertIndicatorProps) {
  const activeAlertSessionId = useVeraStore(
    (state) => state.activeAlertSessionId,
  );

  if (!activeAlertSessionId) {
    return null;
  }

  const isInterior = variant === 'interior';
  const title = isInterior ? 'Alerta ativo' : 'Modo reservado ativo';
  const detail = isInterior
    ? 'Toque para abrir a timeline'
    : 'Toque para continuar.';

  function handlePress() {
    if (!getHasValidVeraSession()) {
      router.push('/(exterior)/vera-unlock');
      return;
    }

    router.push({
      pathname: '/(interior)/alert-timeline',
      params: { alertSessionId: activeAlertSessionId },
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isInterior ? 'Abrir detalhes do alerta ativo' : 'Abrir painel privado'
      }
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        isInterior ? styles.interior : styles.exterior,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.statusDot, isInterior && styles.interiorDot]} />

        <View style={styles.copy}>
          <AppText
            variant="label"
            numberOfLines={1}
            style={[styles.title, isInterior && styles.interiorTitle]}
          >
            {title}
          </AppText>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={[styles.detail, isInterior && styles.interiorDetail]}
          >
            {detail}
          </AppText>
        </View>

        <View style={styles.trailing}>
          <Feather
            name="chevron-right"
            size={17}
            color={isInterior ? veraTheme.icon : colors.blue}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing[3],
  },
  exterior: {
    borderColor: 'rgba(32, 37, 123, 0.14)',
    backgroundColor: 'rgba(32, 37, 123, 0.05)',
  },
  interior: {
    borderColor: veraTheme.summaryBorder,
    backgroundColor: veraTheme.summaryBackground,
  },
  pressed: {
    opacity: 0.72,
  },
  statusDot: {
    width: 9,
    height: 9,
    flexShrink: 0,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  interiorDot: {
    backgroundColor: colors.mint,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 1,
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.blue,
    textTransform: 'uppercase',
  },
  interiorTitle: {
    color: veraTheme.sectionTitle,
  },
  detail: {
    color: colors.muted,
  },
  interiorDetail: {
    color: veraTheme.mutedText,
  },
});
