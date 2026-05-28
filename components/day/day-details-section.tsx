import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  DayLogActionGrid,
  HOME_DAY_LOG_ACTIONS,
} from '@/components/day/day-log-action-grid';
import { AppText, ListActionRow } from '@/components/ui';
import { colors, radius, spacing, surfaces } from '@/constants/theme';
import { parseDateKey } from '@/utils/date';

type DayDetailsSectionProps = {
  dateKey: string;
};

function formatDayLabel(dateKey: string) {
  const date = parseDateKey(dateKey);

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function DayDetailsSection({ dateKey }: DayDetailsSectionProps) {
  function openDayDetails() {
    router.push({
      pathname: '/(exterior)/day',
      params: { date: dateKey },
    });
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="pink" style={styles.eyebrow}>
            detalhes do dia
          </AppText>
          <AppText variant="heading" style={styles.title}>
            {formatDayLabel(dateKey)}
          </AppText>
          <AppText tone="muted" style={styles.subtitle}>
            Registre humor, peso, água e outros sinais sem sair do calendário.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir detalhes completos do dia"
          onPress={openDayDetails}
          style={({ pressed }) => [
            styles.openButton,
            pressed && styles.openButtonPressed,
          ]}
        >
          <Feather name="arrow-up-right" size={22} color={colors.cream} />
        </Pressable>
      </View>

      <DayLogActionGrid
        dateKey={dateKey}
        actions={HOME_DAY_LOG_ACTIONS}
        variant="compact"
      />

      <ListActionRow
        title="Ver dia completo"
        onPress={openDayDetails}
        variant="footer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing[6],
    marginHorizontal: spacing[6],
    padding: spacing[5],
    gap: spacing[4],
    ...surfaces.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[2],
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  title: {
    textTransform: 'capitalize',
  },
  subtitle: {
    lineHeight: 22,
  },
  openButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.blue,
  },
  openButtonPressed: {
    opacity: 0.8,
  },
});
