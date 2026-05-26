import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import {
  useCreateWeightEntryMutation,
  useDeleteWeightEntryMutation,
  useWeightEntriesQuery,
} from '@/hooks/useWeight';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type { WeightEntry } from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import { parseDateKey } from '@/utils/date';

export default function WeightRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const dateKey =
    typeof params.date === 'string' && isDateKey(params.date)
      ? params.date
      : selectedDateKey;
  const insets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (dateKey !== selectedDateKey) {
      selectDate(dateKey);
    }
  }, [dateKey, selectDate, selectedDateKey]);

  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const dayEntriesQuery = useWeightEntriesQuery(dateKey);
  const recentEntriesQuery = useWeightEntriesQuery();
  const createWeightMutation = useCreateWeightEntryMutation();
  const deleteWeightMutation = useDeleteWeightEntryMutation();
  const latestEntry = dayEntriesQuery.data?.[0] ?? null;
  const isRefreshing =
    dayEntriesQuery.isRefetching || recentEntriesQuery.isRefetching;
  const loadError = dayEntriesQuery.error ?? recentEntriesQuery.error;

  function refresh() {
    void Promise.all([dayEntriesQuery.refetch(), recentEntriesQuery.refetch()]);
  }

  async function handleSave() {
    const parsed = parseWeight(weight);

    if (parsed === null) {
      setFormError('Digite um peso entre 20 e 350 kg.');
      setFeedback(null);
      return;
    }

    setFormError(null);
    setFeedback(null);

    try {
      await createWeightMutation.mutateAsync({
        weight: parsed,
        date: dateKey,
      });
      setWeight('');
      setFeedback('Peso salvo para este dia.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Nao foi possivel salvar o peso.'));
    }
  }

  function confirmDelete(entry: WeightEntry) {
    Alert.alert(
      'Remover peso',
      `Remover ${formatWeight(entry.weight)} de ${formatDate(entry.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void deleteWeightMutation.mutateAsync(entry.id);
          },
        },
      ],
    );
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
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
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              Peso corporal
            </AppText>
            <AppText variant="heading">
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="trending-up" size={22} color={colors.cream} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="heading" tone="cream">
              {latestEntry ? formatWeight(latestEntry.weight) : 'Sem registro'}
            </AppText>
            <AppText style={styles.heroText}>
              Acompanhe tendencias ao longo do ciclo sem transformar um numero
              isolado em conclusao.
            </AppText>
          </View>
        </View>

        {loadError ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <AppText variant="caption" style={styles.noticeText}>
              {getApiErrorMessage(loadError, 'Nao deu para carregar pesos.')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Novo registro</AppText>
            <AppText variant="caption" tone="muted">
              quilogramas
            </AppText>
          </View>

          <TextField
            label="Peso"
            value={weight}
            onChangeText={(value) => {
              setWeight(value);
              setFormError(null);
              setFeedback(null);
            }}
            keyboardType="decimal-pad"
            placeholder="65,5"
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />

          <AppText variant="caption" tone="muted" style={styles.hint}>
            Use ponto ou virgula. Exemplo: 65,5.
          </AppText>

          {formError ? (
            <AppText variant="caption" style={styles.formError}>
              {formError}
            </AppText>
          ) : null}
          {feedback ? (
            <AppText variant="caption" style={styles.feedback}>
              {feedback}
            </AppText>
          ) : null}

          <Button
            loading={createWeightMutation.isPending}
            disabled={createWeightMutation.isPending}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            Salvar peso
          </Button>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Neste dia" detail={dateKey} />
          {dayEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <WeightList
              emptyText="Nenhum peso salvo para esse dia."
              entries={dayEntriesQuery.data ?? []}
              onDelete={confirmDelete}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Ultimos registros" detail="historico recente" />
          {recentEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <WeightList
              emptyText="Nenhum peso registrado ainda."
              entries={(recentEntriesQuery.data ?? []).slice(0, 6)}
              onDelete={confirmDelete}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
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

function WeightList({
  emptyText,
  entries,
  onDelete,
}: {
  emptyText: string;
  entries: WeightEntry[];
  onDelete: (entry: WeightEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <Feather name="trending-up" size={18} color={colors.soft} />
        <AppText variant="caption" tone="muted" style={styles.emptyText}>
          {emptyText}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.entriesList}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entryRow}>
          <View style={styles.entryIcon}>
            <Feather name="trending-up" size={15} color={colors.blue} />
          </View>
          <View style={styles.entryCopy}>
            <AppText variant="label">{formatWeight(entry.weight)}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDate(entry.date)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover peso"
            onPress={() => onDelete(entry)}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={16} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function parseWeight(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 20 || parsed > 350) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

function formatWeight(value: number) {
  return `${value.toFixed(1).replace('.', ',')} kg`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.md,
    backgroundColor: colors.plum,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: 0.16,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.sky,
  },
  heroCopy: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing[1],
    color: 'rgba(255, 245, 236, 0.76)',
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
  formCard: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
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
  hint: {
    marginTop: spacing[2],
  },
  formError: {
    marginTop: spacing[4],
    color: colors.danger,
  },
  feedback: {
    marginTop: spacing[4],
    color: colors.blue,
  },
  saveButton: {
    alignSelf: 'stretch',
    marginTop: spacing[6],
  },
  loader: {
    marginVertical: spacing[4],
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
  entriesList: {
    gap: spacing[3],
  },
  entryRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  entryIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  entryCopy: {
    flex: 1,
  },
  deleteButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
});
