import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, surfaces } from '@/constants/theme';
import type { CycleLog } from '@/types/api.types';
import {
  compareDateKeys,
  findCycleForDate,
  findLatestOpenCycle,
  getCycleEndKey,
  getCycleStartKey,
} from '@/utils/cycles';

type PeriodMarkingCardProps = {
  selectedDateKey: string;
  cycles: CycleLog[];
  loading?: boolean;
  saving?: boolean;
  errorMessage?: string | null;
  feedbackMessage?: string | null;
  onMarkStart: () => void;
  onMarkEnd: (cycle: CycleLog) => void;
};

const shortMonthNames = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

function formatDateKey(dateKey: string) {
  const [, month, day] = dateKey.split('-').map(Number);

  return `${day} ${shortMonthNames[month - 1]}`;
}

export function PeriodMarkingCard({
  selectedDateKey,
  cycles,
  loading = false,
  saving = false,
  errorMessage,
  feedbackMessage,
  onMarkStart,
  onMarkEnd,
}: PeriodMarkingCardProps) {
  const selectedCycle = findCycleForDate(cycles, selectedDateKey);
  const latestOpenCycle = findLatestOpenCycle(cycles);
  const cycleForEnding =
    selectedCycle?.endDate === null ? selectedCycle : latestOpenCycle;
  const canEndOpenCycle =
    cycleForEnding !== null &&
    compareDateKeys(selectedDateKey, getCycleStartKey(cycleForEnding)) >= 0;
  const canStartCycle = selectedCycle === null && latestOpenCycle === null;

  const title = getTitle({
    loading,
    selectedCycle,
    latestOpenCycle,
  });
  const description = getDescription({
    loading,
    selectedCycle,
    latestOpenCycle,
    selectedDateKey,
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          <Feather name="droplet" size={15} color={colors.cream} />
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.description}>
            {description}
          </AppText>
        </View>
      </View>

      {errorMessage ? (
        <AppText variant="caption" style={styles.error}>
          {errorMessage}
        </AppText>
      ) : null}

      {feedbackMessage ? (
        <AppText variant="caption" style={styles.feedback}>
          {feedbackMessage}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <PeriodAction
          icon="play-circle"
          label="Marcar início"
          disabled={!canStartCycle || loading || saving}
          loading={saving && canStartCycle}
          onPress={onMarkStart}
        />
        <PeriodAction
          icon="check-circle"
          label="Marcar fim"
          disabled={!canEndOpenCycle || loading || saving}
          loading={saving && canEndOpenCycle}
          onPress={() => {
            if (cycleForEnding) {
              onMarkEnd(cycleForEnding);
            }
          }}
        />
      </View>
    </View>
  );
}

type PeriodActionProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  disabled: boolean;
  loading?: boolean;
  onPress: () => void;
};

function PeriodAction({
  icon,
  label,
  disabled,
  loading = false,
  onPress,
}: PeriodActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.actionPressed,
      ]}
    >
      <Feather
        name={loading ? 'loader' : icon}
        size={15}
        color={disabled ? colors.soft : colors.blue}
      />
      <AppText
        variant="caption"
        tone={disabled ? 'soft' : 'blue'}
        style={styles.actionLabel}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function getTitle({
  loading,
  selectedCycle,
  latestOpenCycle,
}: {
  loading: boolean;
  selectedCycle: CycleLog | null;
  latestOpenCycle: CycleLog | null;
}) {
  if (loading) {
    return 'Sincronizando ciclo';
  }

  if (selectedCycle) {
    return selectedCycle.endDate
      ? 'Menstruação registrada'
      : 'Ciclo em andamento';
  }

  if (latestOpenCycle) {
    return 'Ciclo aberto';
  }

  return 'Registro do dia';
}

function getDescription({
  loading,
  selectedCycle,
  latestOpenCycle,
  selectedDateKey,
}: {
  loading: boolean;
  selectedCycle: CycleLog | null;
  latestOpenCycle: CycleLog | null;
  selectedDateKey: string;
}) {
  if (loading) {
    return 'Buscando seus registros salvos.';
  }

  if (selectedCycle) {
    const startKey = getCycleStartKey(selectedCycle);
    const endKey = getCycleEndKey(selectedCycle);

    if (endKey) {
      return `${formatDateKey(startKey)} a ${formatDateKey(endKey)}.`;
    }

    return `Começou em ${formatDateKey(
      startKey,
    )}. Marque o fim quando o fluxo acabar.`;
  }

  if (latestOpenCycle) {
    const startKey = getCycleStartKey(latestOpenCycle);

    if (compareDateKeys(selectedDateKey, startKey) < 0) {
      return `Há um ciclo aberto desde ${formatDateKey(
        startKey,
      )}. Escolha um dia posterior para encerrar.`;
    }

    return `Ciclo iniciado em ${formatDateKey(startKey)}. Você pode encerrar neste dia.`;
  }

  return 'Marque o início quando a menstruação começar.';
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing[5],
    marginHorizontal: spacing[6],
    padding: spacing[5],
    ...surfaces.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.ink,
  },
  description: {
    marginTop: 2,
  },
  error: {
    marginTop: spacing[3],
    color: colors.danger,
  },
  feedback: {
    marginTop: spacing[3],
    color: colors.blue,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  action: {
    minHeight: 38,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.18)',
    backgroundColor: 'rgba(255, 245, 236, 0.72)',
  },
  actionDisabled: {
    opacity: 0.52,
  },
  actionPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    fontWeight: '800',
  },
});
