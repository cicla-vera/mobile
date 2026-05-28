import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useMonthlySummaryQuery } from '@/hooks/useCycles';
import { getApiErrorMessage } from '@/services/api-error';
import type {
  MonthlySummary,
  SummaryCount,
  SymptomSummaryCount,
} from '@/types/api.types';
import { formatMonthHeading } from '@/utils/calendar';
import { parseMonthKey, shiftMonthKey, toMonthKey } from '@/utils/date';

const moodLabels: Record<string, string> = {
  HAPPY: 'Feliz',
  SAD: 'Triste',
  ANXIOUS: 'Ansiosa',
  IRRITABLE: 'Irritada',
  CALM: 'Calma',
  ENERGETIC: 'Com energia',
  TIRED: 'Cansada',
  SENSITIVE: 'Sensivel',
};

const flowLabels: Record<string, string> = {
  SPOTTING: 'Escape',
  LIGHT: 'Leve',
  MEDIUM: 'Moderado',
  HEAVY: 'Intenso',
  VERY_HEAVY: 'Muito intenso',
};

const activityTypeLabels: Record<string, string> = {
  WALKING: 'Caminhada',
  RUNNING: 'Corrida',
  CYCLING: 'Bicicleta',
  SWIMMING: 'Natacao',
  YOGA: 'Yoga',
  GYM: 'Academia',
  DANCING: 'Danca',
  OTHER: 'Outra',
};

const activityIntensityLabels: Record<string, string> = {
  LOW: 'Leve',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const sleepQualityLabels: Record<string, string> = {
  POOR: 'Ruim',
  FAIR: 'Regular',
  GOOD: 'Boa',
  EXCELLENT: 'Excelente',
};

export default function InsightsRoute() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const summaryQuery = useMonthlySummaryQuery(month);
  const summary = summaryQuery.data;
  const monthTitle = useMemo(() => {
    const { year, month: monthIndex } = parseMonthKey(month);

    return formatMonthHeading(year, monthIndex);
  }, [month]);
  const errorMessage = summaryQuery.error
    ? getApiErrorMessage(
        summaryQuery.error,
        'Não deu para carregar o resumo deste mês agora.',
      )
    : null;

  function handleShiftMonth(delta: number) {
    setMonth((current) => shiftMonthKey(current, delta));
  }

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
            <AppText variant="caption" tone="pink" style={styles.eyebrow}>
              Resumo mensal
            </AppText>
            <AppText variant="heading" style={styles.title}>
              O mês em sinais.
            </AppText>
          </View>
        </View>

        <View style={styles.monthPicker}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            onPress={() => handleShiftMonth(-1)}
            style={styles.monthButton}
          >
            <Feather name="chevron-left" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.monthCopy}>
            <AppText variant="label">{monthTitle}</AppText>
            {summary?.range ? (
              <AppText variant="caption" tone="muted">
                {formatDate(summary.range.start)} a {formatDate(summary.range.end)}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            onPress={() => handleShiftMonth(1)}
            style={styles.monthButton}
          >
            <Feather name="chevron-right" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {summaryQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <AppText variant="caption" tone="muted">
              Montando seu resumo...
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

        {summary ? <MonthlySummaryContent summary={summary} /> : null}
      </ScrollView>
    </Screen>
  );
}

function MonthlySummaryContent({ summary }: { summary: MonthlySummary }) {
  const totalEntries = getTotalEntries(summary);
  const topMood = summary.moods.distribution[0];
  const topSymptom = summary.symptoms.topSymptoms[0];

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Feather name="star" size={22} color={colors.cream} />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="label">{getSummaryHeadline(summary)}</AppText>
          <AppText variant="caption" tone="muted" style={styles.heroText}>
            {getSummaryNarrative(summary)}
          </AppText>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="droplet"
          label="período"
          value={formatDays(summary.cycles.periodDays)}
          detail={`${summary.cycles.total} ciclos no mês`}
        />
        <MetricCard
          icon="activity"
          label="registros"
          value={formatNumber(totalEntries)}
          detail="sinais acompanhados"
        />
        <MetricCard
          icon="moon"
          label="humor principal"
          value={topMood ? getLabel(topMood.value, moodLabels) : '--'}
          detail={
            topMood
              ? formatCount(topMood.count, 'registro', 'registros')
              : 'sem dados'
          }
        />
      </View>

      <Section title="Ciclo">
        <View style={styles.cyclePanel}>
          <View style={styles.cyclePanelHeader}>
            <View>
              <AppText variant="label">Dias menstruais</AppText>
              <AppText variant="caption" tone="muted" style={styles.cardHint}>
                Considerando os ciclos que tocaram este mês.
              </AppText>
            </View>
            <View style={styles.largePill}>
              <Feather name="calendar" size={22} color={colors.blue} />
              <AppText variant="caption" tone="blue" style={styles.pillText}>
                {formatDays(summary.cycles.periodDays)}
              </AppText>
            </View>
          </View>

          {summary.cycles.entries.length > 0 ? (
            <View style={styles.cycleList}>
              {summary.cycles.entries.map((cycle) => (
                <View key={cycle.id} style={styles.cycleRow}>
                  <View style={styles.cycleDate}>
                    <AppText variant="label">{formatDate(cycle.startDate)}</AppText>
                    <AppText variant="caption" tone="muted">
                      {cycle.endDate
                        ? `até ${formatDate(cycle.endDate)}`
                        : 'em andamento'}
                    </AppText>
                  </View>
                  <AppText variant="caption" tone="blue" style={styles.rowValue}>
                    {formatDays(cycle.duration)}
                  </AppText>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState text="Nenhum ciclo registrado neste mês." />
          )}
        </View>
      </Section>

      <Section title="Sinais do corpo">
        <DistributionList
          title="Fluxo"
          icon="droplet"
          items={summary.flow.distribution}
          labelMap={flowLabels}
          emptyLabel="Sem fluxo registrado."
          footer={`${summary.flow.daysWithFlow} dias com fluxo`}
        />
        <DistributionList
          title="Humor"
          icon="smile"
          items={summary.moods.distribution}
          labelMap={moodLabels}
          emptyLabel="Sem humor registrado."
          footer={formatCount(
            summary.moods.totalEntries,
            'registro',
            'registros',
          )}
        />
        <SymptomList
          items={summary.symptoms.topSymptoms}
          totalEntries={summary.symptoms.totalEntries}
          topSymptom={topSymptom}
        />
      </Section>

      <Section title="Bem-estar">
        <View style={styles.healthGrid}>
          <HealthTile
            icon="thermometer"
            label="temperatura"
            value={formatAverage(summary.health.temperature.average, 'C')}
            detail={formatMinMax(
              summary.health.temperature.min,
              summary.health.temperature.max,
              'C',
            )}
          />
          <HealthTile
            icon="trending-up"
            label="peso"
            value={formatAverage(summary.health.weight.average, 'kg')}
            detail={formatMinMax(summary.health.weight.min, summary.health.weight.max, 'kg')}
          />
          <HealthTile
            icon="coffee"
            label="água"
            value={`${formatNumber(summary.health.water.totalAmount)} ml`}
            detail={`${summary.health.water.daysTracked} dias registrados`}
          />
          <HealthTile
            icon="zap"
            label="atividade"
            value={formatMinutes(summary.health.activity.totalDuration)}
            detail={formatAverage(summary.health.activity.averageDuration, 'min')}
          />
          <HealthTile
            icon="moon"
            label="sono"
            value={formatAverage(summary.health.sleep.average, 'h')}
            detail={formatMinMax(summary.health.sleep.min, summary.health.sleep.max, 'h')}
          />
          <HealthTile
            icon="heart"
            label="relações"
            value={formatNumber(summary.health.intercourse.totalEntries)}
            detail={`${summary.health.intercourse.protected} protegidas`}
          />
        </View>

        <DistributionList
          title="Atividades"
          icon="map"
          items={summary.health.activity.byType}
          labelMap={activityTypeLabels}
          emptyLabel="Sem atividade registrada."
          footer={getActivityIntensityText(summary.health.activity.byIntensity)}
        />

        <DistributionList
          title="Sono"
          icon="cloud"
          items={summary.health.sleep.qualityDistribution}
          labelMap={sleepQualityLabels}
          emptyLabel="Sem qualidade de sono registrada."
        />
      </Section>

      <Section title="Notas e cuidados">
        <View style={styles.splitGrid}>
          <CareCard
            icon="edit-3"
            label="notas"
            value={formatNumber(summary.notes.totalEntries)}
            detail="anotações do mês"
          />
          <CareCard
            icon="plus-circle"
            label="medicamentos"
            value={formatNumber(summary.health.medications.totalEntries)}
            detail={getMedicationText(summary.health.medications.uniqueMedications)}
          />
        </View>
      </Section>

      <AppText variant="caption" tone="soft" style={styles.generatedAt}>
        Atualizado em {formatDateTime(summary.generatedAt)}
      </AppText>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="label" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Feather name={icon} size={22} color={colors.blue} />
      </View>
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

function HealthTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.healthTile}>
      <View style={styles.healthHeader}>
        <Feather name={icon} size={22} color={colors.plum} />
        <AppText variant="caption" tone="muted" style={styles.healthLabel}>
          {label}
        </AppText>
      </View>
      <AppText variant="label" style={styles.healthValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {detail}
      </AppText>
    </View>
  );
}

function CareCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.careCard}>
      <Feather name={icon} size={20} color={colors.coral} />
      <AppText variant="caption" tone="muted" style={styles.healthLabel}>
        {label}
      </AppText>
      <AppText variant="heading" style={styles.careValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {detail}
      </AppText>
    </View>
  );
}

function DistributionList({
  title,
  icon,
  items,
  labelMap,
  emptyLabel,
  footer,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  items: SummaryCount[];
  labelMap: Record<string, string>;
  emptyLabel: string;
  footer?: string;
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 0);

  return (
    <View style={styles.distributionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Feather name={icon} size={22} color={colors.blue} />
          <AppText variant="label">{title}</AppText>
        </View>
        {footer ? (
          <AppText variant="caption" tone="muted">
            {footer}
          </AppText>
        ) : null}
      </View>

      {items.length === 0 ? (
        <EmptyState text={emptyLabel} compact />
      ) : (
        <View style={styles.distributionRows}>
          {items.map((item) => (
            <DistributionRow
              key={item.value}
              label={getLabel(item.value, labelMap)}
              count={item.count}
              maxCount={maxCount}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SymptomList({
  items,
  totalEntries,
  topSymptom,
}: {
  items: SymptomSummaryCount[];
  totalEntries: number;
  topSymptom?: SymptomSummaryCount;
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 0);

  return (
    <View style={styles.distributionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Feather name="target" size={22} color={colors.blue} />
          <AppText variant="label">Sintomas</AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {topSymptom
            ? `${topSymptom.name} apareceu mais`
            : formatCount(totalEntries, 'registro', 'registros')}
        </AppText>
      </View>

      {items.length === 0 ? (
        <EmptyState text="Sem sintomas registrados." compact />
      ) : (
        <View style={styles.distributionRows}>
          {items.map((item) => (
            <DistributionRow
              key={item.symptomId}
              label={item.name}
              count={item.count}
              maxCount={maxCount}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function DistributionRow({
  label,
  count,
  maxCount,
}: {
  label: string;
  count: number;
  maxCount: number;
}) {
  const width = (
    maxCount > 0 ? `${Math.max((count / maxCount) * 100, 8)}%` : '0%'
  ) as `${number}%`;

  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionCopy}>
        <AppText variant="caption" style={styles.distributionLabel}>
          {label}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatCount(count, 'vez', 'vezes')}
        </AppText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width }]} />
      </View>
    </View>
  );
}

function EmptyState({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Feather name="calendar" size={22} color={colors.soft} />
      <AppText variant="caption" tone="muted" style={styles.emptyText}>
        {text}
      </AppText>
    </View>
  );
}

function getSummaryHeadline(summary: MonthlySummary) {
  if (summary.cycles.periodDays > 0) {
    return `${formatDays(summary.cycles.periodDays)} de período neste mês`;
  }

  if (summary.moods.totalEntries > 0 || summary.symptoms.totalEntries > 0) {
    return 'Seu mês já tem sinais suficientes para acompanhar';
  }

  return 'Um mês pronto para ser preenchido';
}

function getSummaryNarrative(summary: MonthlySummary) {
  const topMood = summary.moods.distribution[0];
  const topSymptom = summary.symptoms.topSymptoms[0];

  if (topMood && topSymptom) {
    const mood = getLabel(topMood.value, moodLabels);
    const symptomCount = formatCount(topSymptom.count, 'vez', 'vezes');

    return `${mood} foi o humor mais frequente, e ${topSymptom.name} apareceu ${symptomCount}.`;
  }

  if (summary.flow.daysWithFlow > 0) {
    const flowDays = formatDays(summary.flow.daysWithFlow);

    return `Você registrou fluxo em ${flowDays} e pode comparar esse padrao com os próximos meses.`;
  }

  return (
    'Registre ciclo, humor, fluxo e sintomas para transformar o calendário ' +
    'em um retrato mais claro do seu mês.'
  );
}

function getTotalEntries(summary: MonthlySummary) {
  return (
    summary.symptoms.totalEntries +
    summary.moods.totalEntries +
    summary.flow.totalEntries +
    summary.notes.totalEntries +
    summary.health.temperature.totalEntries +
    summary.health.weight.totalEntries +
    summary.health.water.totalEntries +
    summary.health.activity.totalEntries +
    summary.health.sleep.totalEntries +
    summary.health.intercourse.totalEntries +
    summary.health.medications.totalEntries
  );
}

function getActivityIntensityText(items: SummaryCount[]) {
  const topIntensity = items[0];

  return topIntensity
    ? `intensidade ${getLabel(topIntensity.value, activityIntensityLabels).toLowerCase()}`
    : undefined;
}

function getMedicationText(items: SummaryCount[]) {
  const first = items[0];

  if (!first) {
    return 'sem medicamentos';
  }

  return `${getLabel(first.value, {})} em destaque`;
}

function getLabel(value: string, labels: Record<string, string>) {
  return labels[value] ?? value;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '--';
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${formatDate(date.toISOString())} as ${hours}:${minutes}`;
}

function formatNumber(value: number | null) {
  if (value === null) {
    return '--';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function formatDays(value: number | null) {
  if (value === null) {
    return '--';
  }

  return value === 1 ? '1 dia' : `${formatNumber(value)} dias`;
}

function formatMinutes(value: number | null) {
  if (value === null) {
    return '--';
  }

  return value === 1 ? '1 min' : `${formatNumber(value)} min`;
}

function formatAverage(value: number | null, unit: string) {
  if (value === null) {
    return '--';
  }

  return `${formatNumber(value)} ${unit}`;
}

function formatMinMax(min: number | null, max: number | null, unit: string) {
  if (min === null || max === null) {
    return 'sem intervalo';
  }

  if (min === max) {
    return `sempre ${formatNumber(min)} ${unit}`;
  }

  return `${formatNumber(min)} a ${formatNumber(max)} ${unit}`;
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
  monthPicker: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 17, 0.05)',
  },
  monthCopy: {
    flex: 1,
    alignItems: 'center',
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.plum,
  },
  heroCopy: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing[1],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
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
  metricIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  metricLabel: {
    marginTop: spacing[2],
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: spacing[1],
    marginBottom: spacing[1],
    color: colors.blue,
  },
  section: {
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  cyclePanel: {
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  cyclePanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  cardHint: {
    marginTop: 2,
  },
  largePill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  pillText: {
    fontWeight: '800',
  },
  cycleList: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 16, 17, 0.07)',
  },
  cycleDate: {
    flex: 1,
  },
  rowValue: {
    fontWeight: '800',
  },
  distributionCard: {
    marginBottom: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  distributionRows: {
    gap: spacing[3],
    marginTop: spacing[4],
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
  barTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 17, 0.07)',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
  },
  emptyState: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
  },
  emptyStateCompact: {
    minHeight: 82,
  },
  emptyText: {
    maxWidth: 260,
    textAlign: 'center',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  healthTile: {
    minWidth: 136,
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  healthLabel: {
    textTransform: 'uppercase',
  },
  healthValue: {
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  splitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  careCard: {
    minWidth: 150,
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  careValue: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
    color: colors.plum,
  },
  generatedAt: {
    marginTop: spacing[6],
    textAlign: 'center',
  },
});
