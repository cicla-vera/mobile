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
  useCreateSleepEntryMutation,
  useDeleteSleepEntryMutation,
  useSleepEntriesQuery,
} from '@/hooks/useSleep';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type { SleepEntry, SleepQuality } from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import { parseDateKey } from '@/utils/date';

type QualityChoice = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  detail: string;
  value: SleepQuality;
};

const qualityChoices: QualityChoice[] = [
  {
    value: 'POOR',
    label: 'Ruim',
    detail: 'sono leve ou interrompido',
    icon: 'cloud-rain',
  },
  {
    value: 'FAIR',
    label: 'Regular',
    detail: 'descanso parcial',
    icon: 'cloud',
  },
  {
    value: 'GOOD',
    label: 'Boa',
    detail: 'recuperacao tranquila',
    icon: 'moon',
  },
  {
    value: 'EXCELLENT',
    label: 'Excelente',
    detail: 'acordou renovada',
    icon: 'star',
  },
];

export default function SleepRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const dateKey =
    typeof params.date === 'string' && isDateKey(params.date)
      ? params.date
      : selectedDateKey;
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState<SleepQuality>('GOOD');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (dateKey !== selectedDateKey) {
      selectDate(dateKey);
    }
  }, [dateKey, selectDate, selectedDateKey]);

  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const dayEntriesQuery = useSleepEntriesQuery(dateKey);
  const recentEntriesQuery = useSleepEntriesQuery();
  const createSleepMutation = useCreateSleepEntryMutation();
  const deleteSleepMutation = useDeleteSleepEntryMutation();
  const dayEntries = dayEntriesQuery.data ?? [];
  const totalHours = dayEntries.reduce((total, entry) => total + entry.hours, 0);
  const latestEntry = dayEntries[0] ?? null;
  const isRefreshing =
    dayEntriesQuery.isRefetching || recentEntriesQuery.isRefetching;
  const loadError = dayEntriesQuery.error ?? recentEntriesQuery.error;

  function refresh() {
    void Promise.all([dayEntriesQuery.refetch(), recentEntriesQuery.refetch()]);
  }

  function selectQuality(value: SleepQuality) {
    setQuality(value);
    setFormError(null);
    setFeedback(null);
  }

  async function handleSave() {
    const parsedHours = parseHours(hours);

    if (parsedHours === null) {
      setFormError('Digite um valor entre 0,5 e 24 horas.');
      setFeedback(null);
      return;
    }

    setFormError(null);
    setFeedback(null);

    try {
      await createSleepMutation.mutateAsync({
        hours: parsedHours,
        quality,
        date: dateKey,
      });
      setHours('');
      setFeedback('Sono salvo para este dia.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Nao foi possivel salvar o sono.'));
    }
  }

  function confirmDelete(entry: SleepEntry) {
    Alert.alert(
      'Remover sono',
      `Remover ${formatHours(entry.hours)} de ${formatDate(entry.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void deleteSleepMutation.mutateAsync(entry.id);
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
              Sono
            </AppText>
            <AppText variant="heading">
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="moon" size={23} color={colors.cream} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="heading" tone="cream">
              {totalHours > 0 ? formatHours(totalHours) : 'Sem registro'}
            </AppText>
            <AppText style={styles.heroText}>
              {latestEntry
                ? `${getQualityLabel(latestEntry.quality)} no registro mais recente`
                : 'Registre descanso, qualidade e energia entre os ciclos.'}
            </AppText>
          </View>
        </View>

        {loadError ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={22} color={colors.danger} />
            <AppText variant="caption" style={styles.noticeText}>
              {getApiErrorMessage(loadError, 'Nao deu para carregar sono.')}
            </AppText>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Novo registro</AppText>
            <AppText variant="caption" tone="muted">
              horas e qualidade
            </AppText>
          </View>

          <TextField
            label="Horas dormidas"
            value={hours}
            onChangeText={(value) => {
              setHours(value.replace(/[^0-9,.]/g, '').slice(0, 5));
              setFormError(null);
              setFeedback(null);
            }}
            keyboardType="decimal-pad"
            placeholder="7,5"
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />

          <AppText variant="caption" tone="muted" style={styles.hint}>
            Use ponto ou virgula. Exemplo: 7,5.
          </AppText>

          <View style={styles.qualityGrid}>
            {qualityChoices.map((choice) => (
              <Pressable
                key={choice.value}
                accessibilityRole="button"
                accessibilityState={{ selected: quality === choice.value }}
                onPress={() => selectQuality(choice.value)}
                style={[
                  styles.qualityChip,
                  quality === choice.value && styles.qualitySelected,
                ]}
              >
                <View
                  style={[
                    styles.qualityIcon,
                    quality === choice.value && styles.qualityIconSelected,
                  ]}
                >
                  <Feather
                    name={choice.icon}
                    size={22}
                    color={
                      quality === choice.value ? colors.cream : colors.blue
                    }
                  />
                </View>
                <View style={styles.qualityCopy}>
                  <AppText
                    variant="label"
                    tone={quality === choice.value ? 'cream' : 'ink'}
                  >
                    {choice.label}
                  </AppText>
                  <AppText
                    variant="caption"
                    tone={quality === choice.value ? 'cream' : 'muted'}
                  >
                    {choice.detail}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>

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
            loading={createSleepMutation.isPending}
            disabled={createSleepMutation.isPending}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            Salvar sono
          </Button>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Neste dia"
            detail={`${dayEntries.length} registros`}
          />
          {dayEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <SleepList
              emptyText="Nenhum sono salvo para esse dia."
              entries={dayEntries}
              onDelete={confirmDelete}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Ultimos registros" detail="historico recente" />
          {recentEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <SleepList
              emptyText="Nenhum sono registrado ainda."
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

function SleepList({
  emptyText,
  entries,
  onDelete,
}: {
  emptyText: string;
  entries: SleepEntry[];
  onDelete: (entry: SleepEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <Feather name="moon" size={22} color={colors.soft} />
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
            <Feather name="moon" size={22} color={colors.blue} />
          </View>
          <View style={styles.entryCopy}>
            <AppText variant="label">{formatHours(entry.hours)}</AppText>
            <AppText variant="caption" tone="muted">
              {getQualityLabel(entry.quality)} - {formatDate(entry.date)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover sono"
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

function parseHours(value: string) {
  const parsed = Number(value.trim().replace(',', '.'));

  if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 24) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

function getQualityLabel(value: SleepQuality) {
  return qualityChoices.find((choice) => choice.value === value)?.label ?? value;
}

function formatHours(value: number) {
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return `${fixed.replace('.', ',')} h`;
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
    backgroundColor: colors.coral,
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
  qualityGrid: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  qualityChip: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  qualitySelected: {
    borderColor: colors.plum,
    backgroundColor: colors.plum,
  },
  qualityIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  qualityIconSelected: {
    backgroundColor: 'rgba(255, 245, 236, 0.18)',
  },
  qualityCopy: {
    flex: 1,
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
