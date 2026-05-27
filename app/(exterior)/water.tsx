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

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import {
  useCreateWaterEntryMutation,
  useDeleteWaterEntryMutation,
  useWaterDayQuery,
  useWaterEntriesQuery,
} from '@/hooks/useWater';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type { WaterEntry } from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import { parseDateKey } from '@/utils/date';

const amountPresets = [200, 300, 500, 750] as const;
const dailyReferenceAmount = 2000;

export default function WaterRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const dateKey =
    typeof params.date === 'string' && isDateKey(params.date)
      ? params.date
      : selectedDateKey;
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (dateKey !== selectedDateKey) {
      selectDate(dateKey);
    }
  }, [dateKey, selectDate, selectedDateKey]);

  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const dayLogQuery = useWaterDayQuery(dateKey);
  const recentEntriesQuery = useWaterEntriesQuery();
  const createWaterMutation = useCreateWaterEntryMutation();
  const deleteWaterMutation = useDeleteWaterEntryMutation();
  const dayTotal = dayLogQuery.data?.total ?? 0;
  const dayEntries = dayLogQuery.data?.entries ?? [];
  const progress = Math.min(dayTotal / dailyReferenceAmount, 1);
  const isRefreshing =
    dayLogQuery.isRefetching || recentEntriesQuery.isRefetching;
  const loadError = dayLogQuery.error ?? recentEntriesQuery.error;

  function refresh() {
    void Promise.all([dayLogQuery.refetch(), recentEntriesQuery.refetch()]);
  }

  async function saveAmount(value: number) {
    setFormError(null);
    setFeedback(null);

    try {
      await createWaterMutation.mutateAsync({
        amount: value,
        date: dateKey,
      });
      setAmount('');
      setFeedback(`${formatAmount(value)} salvos para este dia.`);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível salvar a água.'),
      );
    }
  }

  async function handleSave() {
    const parsed = parseAmount(amount);

    if (parsed === null) {
      setFormError('Digite uma quantidade entre 1 e 5000 ml.');
      setFeedback(null);
      return;
    }

    await saveAmount(parsed);
  }

  function confirmDelete(entry: WaterEntry) {
    Alert.alert(
      'Remover água',
      `Remover ${formatAmount(entry.amount)} de ${formatDate(entry.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void deleteWaterMutation.mutateAsync(entry.id);
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
          { paddingBottom: spacing[8] + spacing[6] },
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
            <Feather name="arrow-left" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              Ingestão de água
            </AppText>
            <AppText variant="heading">
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="droplet" size={22} color={colors.cream} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="heading" tone="cream">
              {formatAmount(dayTotal)}
            </AppText>
            <AppText style={styles.heroText}>
              Registre copos ou garrafas ao longo do dia para enxergar seus
              padrões de hidratação.
            </AppText>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>

        {loadError ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={22} color={colors.danger} />
            <AppText variant="caption" style={styles.noticeText}>
              {getApiErrorMessage(loadError, 'Não deu para carregar água.')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Adicionar agora</AppText>
            <AppText variant="caption" tone="muted">
              mililitros
            </AppText>
          </View>

          <View style={styles.presetGrid}>
            {amountPresets.map((preset) => (
              <Pressable
                key={preset}
                accessibilityRole="button"
                onPress={() => void saveAmount(preset)}
                style={({ pressed }) => [
                  styles.presetButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText variant="label">{formatAmount(preset)}</AppText>
              </Pressable>
            ))}
          </View>

          <TextField
            label="Outra quantidade"
            value={amount}
            onChangeText={(value) => {
              setAmount(value.replace(/\D/g, '').slice(0, 4));
              setFormError(null);
              setFeedback(null);
            }}
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="250"
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />

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
            loading={createWaterMutation.isPending}
            disabled={createWaterMutation.isPending}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            Salvar quantidade
          </Button>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Neste dia" detail={`${dayEntries.length} itens`} />
          {dayLogQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <WaterList
              emptyText="Nenhuma água salva para esse dia."
              entries={dayEntries}
              onDelete={confirmDelete}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Últimos registros" detail="histórico recente" />
          {recentEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <WaterList
              emptyText="Nenhuma água registrada ainda."
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

function WaterList({
  emptyText,
  entries,
  onDelete,
}: {
  emptyText: string;
  entries: WaterEntry[];
  onDelete: (entry: WaterEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <Feather name="droplet" size={22} color={colors.soft} />
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
            <Feather name="droplet" size={22} color={colors.blue} />
          </View>
          <View style={styles.entryCopy}>
            <AppText variant="label">{formatAmount(entry.amount)}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDate(entry.date)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover água"
            onPress={() => onDelete(entry)}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={22} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function parseAmount(value: string) {
  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 5000) {
    return null;
  }

  return parsed;
}

function formatAmount(value: number) {
  return `${value} ml`;
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
    width: 48,
    height: 48,
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
    backgroundColor: colors.blue,
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
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    marginTop: spacing[4],
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: 'rgba(32, 37, 123, 0.1)',
  },
  progressFill: {
    backgroundColor: colors.sky,
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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  presetButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 158, 208, 0.1)',
  },
  buttonPressed: {
    opacity: 0.72,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  entryCopy: {
    flex: 1,
  },
  deleteButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
});
