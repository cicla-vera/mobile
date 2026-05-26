import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, surfaces } from '@/constants/theme';
import { getApiErrorMessage } from '@/services/api-error';
import type { CyclePrediction } from '@/types/api.types';
import {
  formatPredictionDate,
  getFertileWindowMessage,
  getNextPeriodMessage,
} from '@/utils/prediction';

type CyclePredictionCardProps = {
  prediction?: CyclePrediction;
  loading?: boolean;
  error?: unknown;
};

export function CyclePredictionCard({
  prediction,
  loading = false,
  error,
}: CyclePredictionCardProps) {
  const errorMessage = error
    ? getApiErrorMessage(error, 'Não deu para carregar sua previsão agora.')
    : null;
  const hasPrediction = Boolean(prediction?.nextPeriod);
  const basedOnCycles = prediction?.basedOnCycles ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="pink" style={styles.eyebrow}>
            previsão do ciclo
          </AppText>
          <AppText variant="heading" style={styles.title}>
            {loading ? 'Lendo seus ciclos' : getNextPeriodMessage(prediction)}
          </AppText>
        </View>
        <View style={styles.moon}>
          <Feather name="moon" size={22} color={colors.cream} />
        </View>
      </View>

      {errorMessage ? (
        <AppText variant="caption" style={styles.error}>
          {errorMessage}
        </AppText>
      ) : null}

      {!loading && !errorMessage ? (
        <View style={styles.metrics}>
          <PredictionMetric
            icon="droplet"
            label="próxima"
            value={formatPredictionDate(prediction?.nextPeriod?.date)}
          />
          <PredictionMetric
            icon="sun"
            label="ovulação"
            value={formatPredictionDate(prediction?.ovulationDate?.date)}
          />
          <PredictionMetric
            icon="activity"
            label="janela fértil"
            value={getFertileWindowMessage(prediction)}
            wide
          />
        </View>
      ) : null}

      {!loading && !errorMessage ? (
        <AppText variant="caption" tone="muted" style={styles.context}>
          {hasPrediction
            ? `Baseado em ${basedOnCycles} ${
                basedOnCycles === 1 ? 'ciclo completo' : 'ciclos completos'
              }.`
            : 'Marque início e fim da menstruação para o calendário entender seu ritmo.'}
        </AppText>
      ) : null}
    </View>
  );
}

type PredictionMetricProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  wide?: boolean;
};

function PredictionMetric({
  icon,
  label,
  value,
  wide = false,
}: PredictionMetricProps) {
  return (
    <View style={[styles.metric, wide && styles.metricWide]}>
      <View style={styles.metricIcon}>
        <Feather name={icon} size={22} color={colors.blue} />
      </View>
      <View style={styles.metricCopy}>
        <AppText variant="caption" tone="muted" style={styles.metricLabel}>
          {label}
        </AppText>
        <AppText variant="label" style={styles.metricValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing[1],
    fontSize: 24,
    lineHeight: 30,
  },
  moon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.ink,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  metric: {
    minWidth: 124,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    ...surfaces.inset,
  },
  metricWide: {
    minWidth: 200,
  },
  metricIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  metricCopy: {
    flex: 1,
  },
  metricLabel: {
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 1,
  },
  context: {
    marginTop: spacing[4],
  },
  error: {
    marginTop: spacing[4],
    color: colors.danger,
  },
});
