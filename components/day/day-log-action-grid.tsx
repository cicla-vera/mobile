import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import {
  DAY_LOG_ACTIONS,
  HOME_DAY_LOG_ACTIONS,
  type DayLogAction,
} from '@/constants/day-log-actions';
import { colors, radius, spacing, surfaces } from '@/constants/theme';

type DayLogActionGridProps = {
  dateKey: string;
  actions?: DayLogAction[];
  variant?: 'compact' | 'full';
};

export function DayLogActionGrid({
  dateKey,
  actions = DAY_LOG_ACTIONS,
  variant = 'full',
}: DayLogActionGridProps) {
  const primaryAction = actions.find((action) => action.id === 'log');
  const secondaryActions = actions.filter((action) => action.id !== 'log');

  function navigate(action: DayLogAction) {
    router.push({
      pathname: action.href,
      params: { date: dateKey },
    });
  }

  if (variant === 'compact') {
    return (
      <View style={styles.compactGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => navigate(action)}
            style={({ pressed }) => [
              styles.compactAction,
              pressed && styles.actionPressed,
            ]}
          >
            <View style={styles.compactIcon}>
              <Feather name={action.icon} size={22} color={colors.blue} />
            </View>
            <AppText variant="caption" style={styles.compactLabel}>
              {action.shortLabel}
            </AppText>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      {primaryAction ? (
        <Button onPress={() => navigate(primaryAction)} style={styles.primaryAction}>
          Adicionar registro
        </Button>
      ) : null}

      <View style={styles.fullGrid}>
        {secondaryActions.map((action) => (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => navigate(action)}
            style={({ pressed }) => [
              styles.fullAction,
              pressed && styles.actionPressed,
            ]}
          >
            <View style={styles.fullIcon}>
              <Feather name={action.icon} size={22} color={colors.blue} />
            </View>
            <AppText variant="label" style={styles.fullLabel}>
              {action.shortLabel}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export { HOME_DAY_LOG_ACTIONS };

const styles = StyleSheet.create({
  fullContainer: {
    gap: spacing[4],
  },
  primaryAction: {
    alignSelf: 'stretch',
  },
  fullGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  fullAction: {
    width: '47%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  fullIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  fullLabel: {
    textAlign: 'center',
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  compactAction: {
    width: '31%',
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    ...surfaces.inset,
  },
  compactIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.shell,
  },
  compactLabel: {
    textAlign: 'center',
  },
  actionPressed: {
    opacity: 0.72,
  },
});
