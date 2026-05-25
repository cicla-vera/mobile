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
import { useHistoryChartsQuery } from '@/hooks/useHistoryCharts';
import { getApiErrorMessage } from '@/services/api-error';
import type {
  HistoryCharts,
  MoodEntry,
  MoodType,
  TemperatureEntry,
  WeightEntry,
} from '@/types/api.types';

const CHART_LIMIT = 14;

const moodMeta: Record<
  MoodType,
  {
    label: string;
    shortLabel: string;
    color: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  HAPPY: {
    label: 'Feliz',
    shortLabel: 'feliz',
    color: colors.coral,
    icon: 'sun',
  },
  SAD: {
    label: 'Triste',
    shortLabel: 'triste',
    color: colors.blue,
    icon: 'cloud-rain',
  },
  ANXIOUS: {
    label: 'Ansiosa',
    shortLabel: 'ansiosa',
    color: colors.plum,
    icon: 'wind',
  },
  IRRITABLE: {
    label: 'Irritada',
    shortLabel: 'irritada',
    color: colors.danger,
    icon: 'zap',
  },
  CALM: {
    label: 'Calma',
    shortLabel: 'calma',
    color: colors.mint,
    icon: 'moon',
  },
  ENERGETIC: {
    label: 'Com energia',
    shortLabel: 'energia',
    color: colors.sky,
    icon: 'activity',
  },
  TIRED: {
    label: 'Cansada',
    shortLabel: 'cansada',
    color: colors.soft,
    icon: 'coffee',
  },
  SENSITIVE: {
    label: 'Sensivel',
    shortLabel: 'sensivel',
    color: colors.pink,
    icon: 'heart',
  },
};

export default function ChartsRoute() {
  const chartsQuery = useHistoryChartsQuery();
  const data = chartsQuery.data;
  const errorMessage = chartsQuery.error
    ? getApiErrorMessage(
        chartsQuery.error,
        'Nao deu para carregar seus graficos agora.',
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
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="blue" style={styles.eyebrow}>
              Graficos
            </AppText>
            <AppText variant="heading" style={styles.title}>
              Historico em movimento.
            </AppText>
          </View>
        </View>

        {chartsQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <AppText variant="caption" tone="muted">
              Buscando seus registros...
            </AppText>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <AppText variant="caption" style={styles.errorText}>
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        {data ? <ChartsContent data={data} /> : null}
      </ScrollView>
    </Screen>
  );
}

function ChartsContent({ data }: { data: HistoryCharts }) {
  const temperaturePoints = buildTemperaturePoints(data.temperature);
  const weightPoints = buildWeightPoints(data.weight);
  const moodItems = getRecentMoods(data.moods);
  const moodCounts = getMoodCounts(data.moods);
  const totalSignals =
    data.temperature.length + data.weight.length + data.moods.length;

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Feather name="trending-up" size={18} color={colors.cream} />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="label">{getHeroTitle(totalSignals)}</AppText>
          <AppText variant="caption" tone="muted" style={styles.heroText}>
            {getHeroText(data)}
          </AppText>
        </View>
      </View>

      <TrendChart
        title="Temperatura basal"
        icon="thermometer"
        unit="C"
        color={colors.coral}
        points={temperaturePoints}
        emptyText="Registre temperatura para ver a curva do mes."
      />

      <TrendChart
        title="Peso"
        icon="trending-up"
        unit="kg"
        color={colors.blue}
        points={weightPoints}
        emptyText="Registre peso para acompanhar a tendencia."
      />

      <MoodHistory
        moods={moodItems}
        counts={moodCounts}
        totalEntries={data.moods.length}
      />
    </>
  );
}

type ChartPoint = {
  id: string;
  date: string;
  value: number;
};

function TrendChart({
  title,
  icon,
  unit,
  color,
  points,
  emptyText,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  unit: string;
  color: string;
  points: ChartPoint[];
  emptyText: string;
}) {
  const stats = getNumericStats(points);
  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const delta =
    latest && previous ? roundToOneDecimal(latest.value - previous.value) : null;

  return (
    <View style={styles.chartCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <View style={[styles.cardIcon, { backgroundColor: color }]}>
            <Feather name={icon} size={14} color={colors.cream} />
          </View>
          <View>
            <AppText variant="label">{title}</AppText>
            <AppText variant="caption" tone="muted">
              ultimos {Math.min(points.length, CHART_LIMIT)} registros
            </AppText>
          </View>
        </View>
        <View style={styles.latestPill}>
          <AppText variant="caption" tone="blue" style={styles.latestText}>
            {latest ? `${formatNumber(latest.value)} ${unit}` : '--'}
          </AppText>
        </View>
      </View>

      {points.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <>
          <View style={styles.chartArea}>
            {points.map((point, index) => (
              <ChartBar
                key={point.id}
                color={color}
                point={point}
                min={stats.min}
                max={stats.max}
                showLabel={shouldShowDateLabel(index, points.length)}
              />
            ))}
          </View>

          <View style={styles.metricGrid}>
            <MiniMetric
              label="media"
              value={`${formatNumber(stats.average)} ${unit}`}
            />
            <MiniMetric
              label="intervalo"
              value={`${formatNumber(stats.min)}-${formatNumber(stats.max)}`}
            />
            <MiniMetric label="mudanca" value={formatDelta(delta, unit)} />
          </View>
        </>
      )}
    </View>
  );
}

function ChartBar({
  point,
  min,
  max,
  color,
  showLabel,
}: {
  point: ChartPoint;
  min: number;
  max: number;
  color: string;
  showLabel: boolean;
}) {
  const height = getBarHeight(point.value, min, max);

  return (
    <View style={styles.barColumn}>
      <View style={styles.barSlot}>
        <View style={[styles.bar, { height, backgroundColor: color }]}>
          <View style={styles.barDot} />
        </View>
      </View>
      <AppText
        variant="caption"
        tone={showLabel ? 'muted' : 'soft'}
        style={styles.barLabel}
      >
        {showLabel ? formatShortDate(point.date) : ''}
      </AppText>
    </View>
  );
}

function MoodHistory({
  moods,
  counts,
  totalEntries,
}: {
  moods: MoodEntry[];
  counts: Array<{ mood: MoodType; count: number }>;
  totalEntries: number;
}) {
  const topMood = counts[0];

  return (
    <View style={styles.chartCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <View style={[styles.cardIcon, { backgroundColor: colors.plum }]}>
            <Feather name="smile" size={14} color={colors.cream} />
          </View>
          <View>
            <AppText variant="label">Humor ao longo do tempo</AppText>
            <AppText variant="caption" tone="muted">
              {formatCount(totalEntries, 'registro', 'registros')}
            </AppText>
          </View>
        </View>
        <View style={styles.latestPill}>
          <AppText variant="caption" tone="blue" style={styles.latestText}>
            {topMood ? moodMeta[topMood.mood].shortLabel : '--'}
          </AppText>
        </View>
      </View>

      {moods.length === 0 ? (
        <EmptyState text="Registre humor para visualizar seu mapa emocional." />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodTimeline}
          >
            {moods.map((entry) => (
              <MoodChip key={entry.id} entry={entry} />
            ))}
          </ScrollView>

          <View style={styles.distributionList}>
            {counts.map((item) => (
              <MoodDistributionRow
                key={item.mood}
                mood={item.mood}
                count={item.count}
                maxCount={counts[0]?.count ?? 0}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function MoodChip({ entry }: { entry: MoodEntry }) {
  const meta = moodMeta[entry.mood];

  return (
    <View style={styles.moodChip}>
      <View style={[styles.moodIcon, { backgroundColor: meta.color }]}>
        <Feather name={meta.icon} size={13} color={colors.cream} />
      </View>
      <AppText variant="caption" style={styles.moodChipLabel}>
        {meta.shortLabel}
      </AppText>
      <AppText variant="caption" tone="muted">
        {formatShortDate(entry.date)}
      </AppText>
    </View>
  );
}

function MoodDistributionRow({
  mood,
  count,
  maxCount,
}: {
  mood: MoodType;
  count: number;
  maxCount: number;
}) {
  const meta = moodMeta[mood];
  const width = (
    maxCount > 0 ? `${Math.max((count / maxCount) * 100, 8)}%` : '0%'
  ) as `${number}%`;

  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionCopy}>
        <AppText variant="caption" style={styles.distributionLabel}>
          {meta.label}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatCount(count, 'vez', 'vezes')}
        </AppText>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.trackFill, { width, backgroundColor: meta.color }]}
        />
      </View>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <AppText variant="caption" tone="muted" style={styles.miniMetricLabel}>
        {label}
      </AppText>
      <AppText variant="caption" style={styles.miniMetricValue}>
        {value}
      </AppText>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="bar-chart-2" size={19} color={colors.soft} />
      <AppText variant="caption" tone="muted" style={styles.emptyText}>
        {text}
      </AppText>
    </View>
  );
}

function buildTemperaturePoints(entries: TemperatureEntry[]): ChartPoint[] {
  return getRecentSortedEntries(entries).map((entry) => ({
    id: entry.id,
    date: entry.date,
    value: entry.temperature,
  }));
}

function buildWeightPoints(entries: WeightEntry[]): ChartPoint[] {
  return getRecentSortedEntries(entries).map((entry) => ({
    id: entry.id,
    date: entry.date,
    value: entry.weight,
  }));
}

function getRecentMoods(entries: MoodEntry[]) {
  return getRecentSortedEntries(entries);
}

function getRecentSortedEntries<T extends { date: string }>(entries: T[]) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-CHART_LIMIT);
}

function getMoodCounts(entries: MoodEntry[]) {
  const counts = new Map<MoodType, number>();

  for (const entry of entries) {
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([mood, count]) => ({ mood, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        moodMeta[a.mood].label.localeCompare(moodMeta[b.mood].label),
    );
}

function getNumericStats(points: ChartPoint[]) {
  const values = points.map((point) => point.value);

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    min: roundToOneDecimal(min),
    max: roundToOneDecimal(max),
    average: roundToOneDecimal(average),
  };
}

function getBarHeight(value: number, min: number, max: number) {
  if (max === min) {
    return '58%' as const;
  }

  const normalized = (value - min) / (max - min);
  const percent = Math.round((0.18 + normalized * 0.72) * 100);

  return `${percent}%` as `${number}%`;
}

function shouldShowDateLabel(index: number, total: number) {
  return index === 0 || index === total - 1 || index % 4 === 0;
}

function getHeroTitle(totalSignals: number) {
  if (totalSignals === 0) {
    return 'Seus graficos vao nascer dos registros';
  }

  return `${formatCount(totalSignals, 'sinal', 'sinais')} conectados`;
}

function getHeroText(data: HistoryCharts) {
  const latestMood = getRecentMoods(data.moods).at(-1);

  if (latestMood) {
    const moodLabel = moodMeta[latestMood.mood].label.toLowerCase();

    return (
      `Ultimo humor registrado: ${moodLabel}. ` +
      'Compare com peso e temperatura para notar padroes.'
    );
  }

  if (data.temperature.length > 0 || data.weight.length > 0) {
    return 'Acompanhe pequenas variacoes ao longo do tempo sem perder o contexto do calendario.';
  }

  return (
    'Peso, temperatura e humor aparecem aqui em uma visao simples, ' +
    'feita para acompanhar tendencias.'
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace('.', ',');
}

function formatDelta(value: number | null, unit: string) {
  if (value === null) {
    return '--';
  }

  if (value === 0) {
    return `0 ${unit}`;
  }

  const sign = value > 0 ? '+' : '';

  return `${sign}${formatNumber(value)} ${unit}`;
}

function formatShortDate(value: string) {
  const [, month, day] = value.slice(0, 10).split('-');

  return `${day}/${month}`;
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
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
    width: 38,
    height: 38,
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
    minHeight: 160,
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  heroIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.ink,
  },
  heroCopy: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing[1],
  },
  chartCard: {
    marginTop: spacing[5],
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  cardTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  latestPill: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  latestText: {
    fontWeight: '800',
  },
  chartArea: {
    height: 184,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[5],
    paddingTop: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 16, 17, 0.09)',
  },
  barColumn: {
    flex: 1,
    minWidth: 12,
    alignItems: 'center',
  },
  barSlot: {
    height: 140,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 10,
    minHeight: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: radius.pill,
  },
  barDot: {
    width: 8,
    height: 8,
    marginTop: -3,
    borderRadius: 4,
    backgroundColor: colors.cream,
  },
  barLabel: {
    minHeight: 18,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  miniMetric: {
    minWidth: 88,
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.78)',
  },
  miniMetricLabel: {
    textTransform: 'uppercase',
  },
  miniMetricValue: {
    marginTop: spacing[1],
    fontWeight: '800',
  },
  emptyState: {
    minHeight: 134,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[5],
  },
  emptyText: {
    maxWidth: 260,
    textAlign: 'center',
  },
  moodTimeline: {
    gap: spacing[3],
    paddingTop: spacing[5],
    paddingBottom: spacing[1],
  },
  moodChip: {
    width: 88,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.82)',
  },
  moodIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  moodChipLabel: {
    marginTop: spacing[2],
    fontWeight: '800',
    textAlign: 'center',
  },
  distributionList: {
    gap: spacing[3],
    marginTop: spacing[5],
  },
  distributionRow: {
    gap: spacing[2],
  },
  distributionCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  distributionLabel: {
    flex: 1,
    fontWeight: '800',
  },
  track: {
    height: 6,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 17, 0.07)',
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
