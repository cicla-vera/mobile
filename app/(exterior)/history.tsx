import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useCycleHistoryQuery } from '@/hooks/useCycles';
import { getApiErrorMessage } from '@/services/api-error';
import type {
  CycleHistoryItem,
  CycleHistoryRegularity,
} from '@/types/api.types';

const monthNames = [
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

export default function HistoryRoute() {
  const historyQuery = useCycleHistoryQuery();
  const history = historyQuery.data;
  const errorMessage = historyQuery.error
    ? getApiErrorMessage(
        historyQuery.error,
        'Nao deu para carregar seu historico agora.',
      )
    : null;

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="blue" style={styles.eyebrow}>
              Historico
            </AppText>
            <AppText variant="heading" style={styles.title}>
              Seus ciclos em perspectiva.
            </AppText>
          </View>
        </View>

        {historyQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <AppText variant="caption" tone="muted">
              Buscando seus ciclos...
            </AppText>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={22} color={colors.danger} />
            <AppText variant="caption" style={styles.errorText}>
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        {history ? (
          <>
            <View style={styles.metricsGrid}>
              <MetricCard
                label="ciclos"
                value={formatNumber(history.stats.totalCycles)}
                detail={`${formatNumber(history.stats.completeCycles)} completos`}
              />
              <MetricCard
                label="duracao media"
                value={formatDays(history.stats.averageDuration)}
                detail={formatRange(
                  history.stats.shortest,
                  history.stats.longest,
                )}
              />
              <MetricCard
                label="ritmo medio"
                value={formatDays(history.stats.averageCycleLength)}
                detail={formatRange(
                  history.stats.shortestCycleLength,
                  history.stats.longestCycleLength,
                )}
              />
            </View>

            <RegularityCard regularity={history.stats.regularity} />

            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <AppText variant="label">Ciclos registrados</AppText>
                {historyQuery.isFetching ? (
                  <ActivityIndicator color={colors.blue} size="small" />
                ) : null}
              </View>

              {history.cycles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="calendar" size={20} color={colors.soft} />
                  <AppText
                    variant="caption"
                    tone="muted"
                    style={styles.emptyText}
                  >
                    Marque inicio e fim da menstruacao no calendario para ver seu
                    historico aqui.
                  </AppText>
                </View>
              ) : (
                <View style={styles.cycleList}>
                  {history.cycles.map((cycle) => (
                    <CycleHistoryRow key={cycle.id} cycle={cycle} />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <AppText variant="caption" tone="muted" style={styles.metricLabel}>
        {label}
      </AppText>
      <AppText variant="heading" style={styles.metricValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {detail}
      </AppText>
    </View>
  );
}

function RegularityCard({
  regularity,
}: {
  regularity: CycleHistoryRegularity;
}) {
  const copy = getRegularityCopy(regularity);

  return (
    <View style={styles.regularityCard}>
      <View style={[styles.regularityIcon, { backgroundColor: copy.color }]}>
        <Feather name={copy.icon} size={22} color={colors.cream} />
      </View>
      <View style={styles.regularityCopy}>
        <AppText variant="label">{copy.title}</AppText>
        <AppText variant="caption" tone="muted" style={styles.regularityText}>
          {copy.description}
        </AppText>
      </View>
    </View>
  );
}

function CycleHistoryRow({ cycle }: { cycle: CycleHistoryItem }) {
  const open = cycle.endDate === null;

  return (
    <View style={styles.cycleRow}>
      <View style={styles.cycleDate}>
        <AppText variant="label">{formatDate(cycle.startDate)}</AppText>
        <AppText variant="caption" tone="muted">
          {open ? 'em andamento' : `ate ${formatDate(cycle.endDate)}`}
        </AppText>
      </View>
      <View style={styles.cycleStats}>
        <SmallPill
          icon="droplet"
          label={formatDays(cycle.periodDuration)}
          muted={open}
        />
        <SmallPill icon="repeat" label={formatDays(cycle.cycleLength)} muted />
      </View>
    </View>
  );
}

function SmallPill({
  icon,
  label,
  muted = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.pill, muted && styles.pillMuted]}>
      <Feather
        name={icon}
        size={22}
        color={muted ? colors.muted : colors.blue}
      />
      <AppText
        variant="caption"
        tone={muted ? 'muted' : 'blue'}
        style={styles.pillText}
      >
        {label}
      </AppText>
    </View>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return '--';
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);

  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatNumber(value: number | null) {
  return value === null ? '--' : String(value);
}

function formatDays(value: number | null) {
  if (value === null) {
    return '--';
  }

  return value === 1 ? '1 dia' : `${value} dias`;
}

function formatRange(shortest: number | null, longest: number | null) {
  if (shortest === null || longest === null) {
    return 'sem intervalo ainda';
  }

  if (shortest === longest) {
    return `sempre ${formatDays(shortest)}`;
  }

  return `${formatDays(shortest)} a ${formatDays(longest)}`;
}

function getRegularityCopy(regularity: CycleHistoryRegularity) {
  if (regularity.status === 'REGULAR') {
    return {
      title: 'Ritmo consistente',
      description:
        regularity.variationDays === null
          ? 'Seus ciclos estao dentro de uma variacao esperada.'
          : `Variacao de ${formatDays(regularity.variationDays)} entre ciclos.`,
      icon: 'check-circle' as const,
      color: colors.mint,
    };
  }

  if (regularity.status === 'IRREGULAR') {
    return {
      title: 'Ritmo variando',
      description:
        regularity.variationDays === null
          ? 'Continue registrando para acompanhar o padrao.'
          : `Variacao de ${formatDays(regularity.variationDays)} entre ciclos.`,
      icon: 'activity' as const,
      color: colors.coral,
    };
  }

  return {
    title: 'Ainda aprendendo',
    description: 'Registre pelo menos tres ciclos para medir regularidade.',
    icon: 'clock' as const,
    color: colors.blue,
  };
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[10],
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
  },
  loading: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginTop: spacing[5],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  metricCard: {
    minWidth: 136,
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  metricLabel: {
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: spacing[1],
    marginBottom: spacing[1],
    color: colors.blue,
  },
  regularityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  regularityIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  regularityCopy: {
    flex: 1,
  },
  regularityText: {
    marginTop: 2,
  },
  listSection: {
    marginTop: spacing[6],
  },
  listHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  emptyState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  emptyText: {
    maxWidth: 260,
    textAlign: 'center',
  },
  cycleList: {
    gap: spacing[3],
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  cycleDate: {
    flex: 1,
  },
  cycleStats: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  pill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  pillMuted: {
    backgroundColor: 'rgba(20, 16, 17, 0.06)',
  },
  pillText: {
    fontWeight: '800',
  },
});
