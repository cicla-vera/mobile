import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '@/components/ui';
import { FLOW_CHOICES, MOOD_CHOICES } from '@/constants/daily-log';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useCyclePredictionQuery, useCyclesQuery } from '@/hooks/useCycles';
import { useDailyLogQuery } from '@/hooks/useDailyLog';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type { DailyLog, FlowIntensity, MoodType } from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import {
  findCycleForDate,
  getCycleEndKey,
  getCycleStartKey,
} from '@/utils/cycles';
import { parseDateKey } from '@/utils/date';

export default function DayDetailsRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const dateKey =
    typeof params.date === 'string' && isDateKey(params.date)
      ? params.date
      : selectedDateKey;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (dateKey !== selectedDateKey) {
      selectDate(dateKey);
    }
  }, [dateKey, selectDate, selectedDateKey]);

  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const dailyLogQuery = useDailyLogQuery(dateKey);
  const cyclesQuery = useCyclesQuery();
  const cyclePredictionQuery = useCyclePredictionQuery();
  const cycleForDate = findCycleForDate(cyclesQuery.data ?? [], dateKey);
  const dayFlags = getDayFlags(
    dateKey,
    Boolean(cycleForDate),
    cyclePredictionQuery.data?.nextPeriod?.date,
    cyclePredictionQuery.data?.fertileWindow,
  );
  const isRefreshing =
    dailyLogQuery.isRefetching ||
    cyclesQuery.isRefetching ||
    cyclePredictionQuery.isRefetching;
  const loadError =
    dailyLogQuery.error ?? cyclesQuery.error ?? cyclePredictionQuery.error;

  function refresh() {
    void Promise.all([
      dailyLogQuery.refetch(),
      cyclesQuery.refetch(),
      cyclePredictionQuery.refetch(),
    ]);
  }

  function goToLog() {
    router.push({
      pathname: '/(exterior)/log',
      params: { date: dateKey },
    });
  }

  function goToTemperature() {
    router.push({
      pathname: '/(exterior)/temperature',
      params: { date: dateKey },
    });
  }

  function goToWeight() {
    router.push({
      pathname: '/(exterior)/weight',
      params: { date: dateKey },
    });
  }

  function goToWater() {
    router.push({
      pathname: '/(exterior)/water',
      params: { date: dateKey },
    });
  }

  function goToActivity() {
    router.push({
      pathname: '/(exterior)/activity',
      params: { date: dateKey },
    });
  }

  function goToSleep() {
    router.push({
      pathname: '/(exterior)/sleep',
      params: { date: dateKey },
    });
  }

  function goToIntercourse() {
    router.push({
      pathname: '/(exterior)/intercourse',
      params: { date: dateKey },
    });
  }

  function goToMedications() {
    router.push({
      pathname: '/(exterior)/medications',
      params: { date: dateKey },
    });
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing[8]) + spacing[6] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o calendario"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              Detalhes do dia
            </AppText>
            <AppText variant="heading">
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.dateBadge}>
              <AppText variant="caption" tone="cream">
                {selectedDate
                  .toLocaleDateString('pt-BR', { weekday: 'short' })
                  .replace('.', '')}
              </AppText>
              <AppText variant="heading" tone="cream">
                {String(selectedDate.getDate()).padStart(2, '0')}
              </AppText>
            </View>
            <View style={styles.heroCopy}>
              <AppText variant="heading" tone="cream">
                {getDayMood(dailyLogQuery.data)}
              </AppText>
              <AppText style={styles.heroText}>
                {getDaySummary(dailyLogQuery.data)}
              </AppText>
            </View>
          </View>

          <View style={styles.flagsRow}>
            {dayFlags.map((flag) => (
              <View key={flag.label} style={styles.flag}>
                <Feather name={flag.icon} size={13} color={colors.cream} />
                <AppText variant="caption" tone="cream">
                  {flag.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {loadError ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <AppText variant="caption" style={styles.noticeText}>
              {getApiErrorMessage(loadError, 'Nao deu para carregar esse dia.')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="smile"
            label="humor"
            value={String(dailyLogQuery.data?.moods.length ?? 0)}
          />
          <MetricCard
            icon="droplet"
            label="fluxo"
            value={String(dailyLogQuery.data?.flow.length ?? 0)}
          />
          <MetricCard
            icon="activity"
            label="sintomas"
            value={String(dailyLogQuery.data?.symptoms.length ?? 0)}
          />
          <MetricCard
            icon="edit-3"
            label="notas"
            value={String(dailyLogQuery.data?.notes.length ?? 0)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Ciclo"
            detail={getCycleDetail(cycleForDate, dateKey)}
          />
          <CyclePanel
            loading={cyclesQuery.isLoading}
            cycle={cycleForDate}
            dateKey={dateKey}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Registros salvos" detail="o retrato do dia" />
          {dailyLogQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <DailyLogDetails data={dailyLogQuery.data} />
          )}
        </View>

        <Button onPress={goToLog} style={styles.actionButton}>
          Adicionar registro
        </Button>
        <Button
          variant="secondary"
          onPress={goToTemperature}
          style={styles.secondaryActionButton}
        >
          Registrar temperatura
        </Button>
        <Button
          variant="secondary"
          onPress={goToWeight}
          style={styles.secondaryActionButton}
        >
          Registrar peso
        </Button>
        <Button
          variant="secondary"
          onPress={goToWater}
          style={styles.secondaryActionButton}
        >
          Registrar agua
        </Button>
        <Button
          variant="secondary"
          onPress={goToActivity}
          style={styles.secondaryActionButton}
        >
          Registrar atividade
        </Button>
        <Button
          variant="secondary"
          onPress={goToSleep}
          style={styles.secondaryActionButton}
        >
          Registrar sono
        </Button>
        <Button
          variant="secondary"
          onPress={goToIntercourse}
          style={styles.secondaryActionButton}
        >
          Registrar relacao
        </Button>
        <Button
          variant="secondary"
          onPress={goToMedications}
          style={styles.secondaryActionButton}
        >
          Registrar medicamento
        </Button>
      </ScrollView>
    </Screen>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Feather name={icon} size={14} color={colors.blue} />
      </View>
      <AppText variant="caption" tone="muted" style={styles.metricLabel}>
        {label}
      </AppText>
      <AppText variant="heading" style={styles.metricValue}>
        {value}
      </AppText>
    </View>
  );
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="label">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {detail}
      </AppText>
    </View>
  );
}

function CyclePanel({
  cycle,
  dateKey,
  loading,
}: {
  cycle: ReturnType<typeof findCycleForDate>;
  dateKey: string;
  loading: boolean;
}) {
  if (loading) {
    return <ActivityIndicator color={colors.blue} style={styles.loader} />;
  }

  if (!cycle) {
    return (
      <EmptyBlock
        icon="moon"
        text="Esse dia ainda nao esta marcado como periodo menstrual."
      />
    );
  }

  const start = getCycleStartKey(cycle);
  const end = getCycleEndKey(cycle);
  const isStart = start === dateKey;
  const isEnd = end === dateKey;

  return (
    <View style={styles.cyclePanel}>
      <View style={styles.cycleIcon}>
        <Feather name="droplet" size={18} color={colors.cream} />
      </View>
      <View style={styles.cycleCopy}>
        <AppText variant="label">
          {isStart
            ? 'Inicio da menstruacao'
            : isEnd
              ? 'Fim da menstruacao'
              : 'Periodo menstrual'}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.cycleText}>
          {end
            ? `${formatShortDate(start)} ate ${formatShortDate(end)}`
            : `Comecou em ${formatShortDate(start)} e segue em aberto`}
        </AppText>
      </View>
    </View>
  );
}

function DailyLogDetails({ data }: { data?: DailyLog }) {
  const moods = data?.moods ?? [];
  const flow = data?.flow ?? [];
  const symptoms = data?.symptoms ?? [];
  const notes = data?.notes ?? [];
  const empty =
    moods.length === 0 &&
    flow.length === 0 &&
    symptoms.length === 0 &&
    notes.length === 0;

  if (empty) {
    return (
      <EmptyBlock
        icon="calendar"
        text="Nada salvo para esse dia ainda. Adicione um registro para completar o diario."
      />
    );
  }

  return (
    <View style={styles.detailsList}>
      {moods.length > 0 ? (
        <DetailGroup
          icon="smile"
          title="Humor"
          entries={moods.map((entry) => ({
            id: entry.id,
            title: getMoodLabel(entry.mood),
            detail: formatCreatedAt(entry.createdAt),
          }))}
        />
      ) : null}
      {flow.length > 0 ? (
        <DetailGroup
          icon="droplet"
          title="Fluxo"
          entries={flow.map((entry) => ({
            id: entry.id,
            title: getFlowLabel(entry.intensity),
            detail: formatCreatedAt(entry.createdAt),
          }))}
        />
      ) : null}
      {symptoms.length > 0 ? (
        <DetailGroup
          icon="activity"
          title="Sintomas"
          entries={symptoms.map((entry) => ({
            id: entry.id,
            title: entry.symptom.name,
            detail: entry.intensity
              ? `Intensidade ${entry.intensity}`
              : 'Sem intensidade',
          }))}
        />
      ) : null}
      {notes.length > 0 ? (
        <DetailGroup
          icon="edit-3"
          title="Notas"
          entries={notes.map((entry) => ({
            id: entry.id,
            title: entry.content,
            detail: formatCreatedAt(entry.createdAt),
          }))}
        />
      ) : null}
    </View>
  );
}

function DetailGroup({
  entries,
  icon,
  title,
}: {
  entries: Array<{ id: string; title: string; detail: string }>;
  icon: keyof typeof Feather.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.detailGroup}>
      <View style={styles.detailGroupHeader}>
        <View style={styles.detailIcon}>
          <Feather name={icon} size={14} color={colors.blue} />
        </View>
        <AppText variant="label">{title}</AppText>
      </View>
      <View style={styles.detailEntries}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.detailRow}>
            <AppText variant="body" style={styles.detailTitle}>
              {entry.title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {entry.detail}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyBlock({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.emptyBlock}>
      <Feather name={icon} size={18} color={colors.soft} />
      <AppText variant="caption" tone="muted" style={styles.emptyText}>
        {text}
      </AppText>
    </View>
  );
}

function getDayFlags(
  dateKey: string,
  isPeriod: boolean,
  nextPeriodDate?: string | null,
  fertileWindow?: { start: string; end: string } | null,
) {
  const flags: Array<{ icon: keyof typeof Feather.glyphMap; label: string }> = [];

  if (isPeriod) {
    flags.push({ icon: 'droplet', label: 'periodo' });
  }

  if (nextPeriodDate === dateKey) {
    flags.push({ icon: 'calendar', label: 'previsto' });
  }

  if (
    fertileWindow &&
    dateKey >= fertileWindow.start &&
    dateKey <= fertileWindow.end
  ) {
    flags.push({ icon: 'sun', label: 'janela fertil' });
  }

  if (flags.length === 0) {
    flags.push({ icon: 'moon', label: 'dia comum' });
  }

  return flags;
}

function getDayMood(data?: DailyLog) {
  const latestMood = data?.moods[0]?.mood;

  if (latestMood) {
    return getMoodLabel(latestMood);
  }

  if ((data?.symptoms.length ?? 0) > 0) {
    return 'Sinais registrados';
  }

  return 'Dia em aberto';
}

function getDaySummary(data?: DailyLog) {
  const total =
    (data?.moods.length ?? 0) +
    (data?.flow.length ?? 0) +
    (data?.symptoms.length ?? 0) +
    (data?.notes.length ?? 0);

  if (total === 0) {
    return 'Um espaco limpo para observar o corpo sem pressa.';
  }

  if (total === 1) {
    return 'Um registro salvo para voltar quando precisar.';
  }

  return `${total} registros salvos para compor o retrato desse dia.`;
}

function getCycleDetail(
  cycle: ReturnType<typeof findCycleForDate>,
  dateKey: string,
) {
  if (!cycle) {
    return 'sem periodo salvo';
  }

  if (getCycleStartKey(cycle) === dateKey) {
    return 'inicio marcado';
  }

  if (getCycleEndKey(cycle) === dateKey) {
    return 'fim marcado';
  }

  return 'dentro do periodo';
}

function getMoodLabel(value: MoodType) {
  return MOOD_CHOICES.find((mood) => mood.value === value)?.label ?? value;
}

function getFlowLabel(value: FlowIntensity) {
  return FLOW_CHOICES.find((flow) => flow.value === value)?.label ?? value;
}

function formatShortDate(dateKey: string) {
  const date = parseDateKey(dateKey);

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'salvo';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroCard: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: 0.16,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  dateBadge: {
    width: 70,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.pink,
  },
  heroCopy: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing[1],
    color: 'rgba(255, 245, 236, 0.76)',
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[5],
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  noticeText: {
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
    width: '47%',
    minHeight: 118,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  metricIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.shell,
  },
  metricLabel: {
    marginTop: spacing[3],
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: spacing[1],
  },
  section: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  loader: {
    marginVertical: spacing[4],
  },
  cyclePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.shell,
  },
  cycleIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.pink,
  },
  cycleCopy: {
    flex: 1,
  },
  cycleText: {
    marginTop: 2,
  },
  detailsList: {
    gap: spacing[4],
  },
  detailGroup: {
    gap: spacing[3],
  },
  detailGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.shell,
  },
  detailEntries: {
    gap: spacing[2],
  },
  detailRow: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  detailTitle: {
    marginBottom: 2,
  },
  emptyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  emptyText: {
    flex: 1,
  },
  actionButton: {
    alignSelf: 'stretch',
    marginTop: spacing[5],
  },
  secondaryActionButton: {
    alignSelf: 'stretch',
    marginTop: spacing[3],
  },
});
