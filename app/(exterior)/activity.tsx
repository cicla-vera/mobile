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
  useActivityEntriesQuery,
  useCreateActivityEntryMutation,
  useDeleteActivityEntryMutation,
} from '@/hooks/useActivity';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type {
  ActivityEntry,
  ActivityIntensity,
  ActivityType,
} from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import { parseDateKey } from '@/utils/date';

type ActivityChoice = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: ActivityType;
};

type IntensityChoice = {
  detail: string;
  label: string;
  value: ActivityIntensity;
};

const activityChoices: ActivityChoice[] = [
  { value: 'WALKING', label: 'Caminhada', icon: 'map' },
  { value: 'RUNNING', label: 'Corrida', icon: 'zap' },
  { value: 'CYCLING', label: 'Bike', icon: 'repeat' },
  { value: 'SWIMMING', label: 'Natacao', icon: 'droplet' },
  { value: 'YOGA', label: 'Yoga', icon: 'sun' },
  { value: 'GYM', label: 'Academia', icon: 'target' },
  { value: 'DANCING', label: 'Danca', icon: 'music' },
  { value: 'OTHER', label: 'Outro', icon: 'plus' },
];

const intensityChoices: IntensityChoice[] = [
  { value: 'LOW', label: 'Leve', detail: 'ritmo tranquilo' },
  { value: 'MEDIUM', label: 'Media', detail: 'esforco moderado' },
  { value: 'HIGH', label: 'Alta', detail: 'intensa' },
];

export default function ActivityRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const dateKey =
    typeof params.date === 'string' && isDateKey(params.date)
      ? params.date
      : selectedDateKey;
  const [type, setType] = useState<ActivityType>('WALKING');
  const [intensity, setIntensity] = useState<ActivityIntensity>('LOW');
  const [duration, setDuration] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (dateKey !== selectedDateKey) {
      selectDate(dateKey);
    }
  }, [dateKey, selectDate, selectedDateKey]);

  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const dayEntriesQuery = useActivityEntriesQuery(dateKey);
  const recentEntriesQuery = useActivityEntriesQuery();
  const createActivityMutation = useCreateActivityEntryMutation();
  const deleteActivityMutation = useDeleteActivityEntryMutation();
  const dayEntries = dayEntriesQuery.data ?? [];
  const dayDuration = dayEntries.reduce(
    (total, entry) => total + entry.duration,
    0,
  );
  const isRefreshing =
    dayEntriesQuery.isRefetching || recentEntriesQuery.isRefetching;
  const loadError = dayEntriesQuery.error ?? recentEntriesQuery.error;

  function refresh() {
    void Promise.all([dayEntriesQuery.refetch(), recentEntriesQuery.refetch()]);
  }

  function selectType(value: ActivityType) {
    setType(value);
    setFormError(null);
    setFeedback(null);
  }

  function selectIntensity(value: ActivityIntensity) {
    setIntensity(value);
    setFormError(null);
    setFeedback(null);
  }

  async function handleSave() {
    const parsedDuration = parseDuration(duration);

    if (parsedDuration === null) {
      setFormError('Digite uma duracao entre 1 e 1440 minutos.');
      setFeedback(null);
      return;
    }

    setFormError(null);
    setFeedback(null);

    try {
      await createActivityMutation.mutateAsync({
        type,
        intensity,
        duration: parsedDuration,
        date: dateKey,
      });
      setDuration('');
      setFeedback('Atividade salva para este dia.');
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Nao foi possivel salvar a atividade.'),
      );
    }
  }

  function confirmDelete(entry: ActivityEntry) {
    Alert.alert(
      'Remover atividade',
      `Remover ${getActivityLabel(entry.type)} de ${formatDate(entry.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void deleteActivityMutation.mutateAsync(entry.id);
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
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              Atividade fisica
            </AppText>
            <AppText variant="heading">
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="activity" size={23} color={colors.cream} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="heading" tone="cream">
              {formatDuration(dayDuration)}
            </AppText>
            <AppText style={styles.heroText}>
              Observe movimento, intensidade e energia junto com os sinais do
              ciclo.
            </AppText>
          </View>
        </View>

        {loadError ? (
          <View style={styles.notice}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <AppText variant="caption" style={styles.noticeText}>
              {getApiErrorMessage(
                loadError,
                'Nao deu para carregar atividades.',
              )}
            </AppText>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Novo movimento</AppText>
            <AppText variant="caption" tone="muted">
              escolha tipo e intensidade
            </AppText>
          </View>

          <View style={styles.choiceGrid}>
            {activityChoices.map((choice) => (
              <Pressable
                key={choice.value}
                accessibilityRole="button"
                accessibilityState={{ selected: type === choice.value }}
                onPress={() => selectType(choice.value)}
                style={[
                  styles.typeChip,
                  type === choice.value && styles.typeChipSelected,
                ]}
              >
                <Feather
                  name={choice.icon}
                  size={15}
                  color={type === choice.value ? colors.cream : colors.blue}
                />
                <AppText
                  variant="caption"
                  tone={type === choice.value ? 'cream' : 'ink'}
                  style={styles.choiceLabel}
                >
                  {choice.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.intensityGrid}>
            {intensityChoices.map((choice) => (
              <Pressable
                key={choice.value}
                accessibilityRole="button"
                accessibilityState={{ selected: intensity === choice.value }}
                onPress={() => selectIntensity(choice.value)}
                style={[
                  styles.intensityChip,
                  intensity === choice.value && styles.intensitySelected,
                ]}
              >
                <AppText
                  variant="label"
                  tone={intensity === choice.value ? 'cream' : 'ink'}
                >
                  {choice.label}
                </AppText>
                <AppText
                  variant="caption"
                  tone={intensity === choice.value ? 'cream' : 'muted'}
                >
                  {choice.detail}
                </AppText>
              </Pressable>
            ))}
          </View>

          <TextField
            label="Duracao"
            value={duration}
            onChangeText={(value) => {
              setDuration(value.replace(/\D/g, '').slice(0, 4));
              setFormError(null);
              setFeedback(null);
            }}
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="30"
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />

          <AppText variant="caption" tone="muted" style={styles.hint}>
            Informe a duracao em minutos.
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
            loading={createActivityMutation.isPending}
            disabled={createActivityMutation.isPending}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            Salvar atividade
          </Button>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Neste dia"
            detail={`${dayEntries.length} atividades`}
          />
          {dayEntriesQuery.isLoading ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <ActivityList
              emptyText="Nenhuma atividade salva para esse dia."
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
            <ActivityList
              emptyText="Nenhuma atividade registrada ainda."
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

function ActivityList({
  emptyText,
  entries,
  onDelete,
}: {
  emptyText: string;
  entries: ActivityEntry[];
  onDelete: (entry: ActivityEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <Feather name="activity" size={18} color={colors.soft} />
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
            <Feather name="activity" size={15} color={colors.blue} />
          </View>
          <View style={styles.entryCopy}>
            <AppText variant="label">{getActivityLabel(entry.type)}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDuration(entry.duration)} -{' '}
              {getIntensityLabel(entry.intensity)} - {formatDate(entry.date)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover atividade"
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

function parseDuration(value: string) {
  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440) {
    return null;
  }

  return parsed;
}

function getActivityLabel(value: ActivityType) {
  return activityChoices.find((choice) => choice.value === value)?.label ?? value;
}

function getIntensityLabel(value: ActivityIntensity) {
  return (
    intensityChoices.find((choice) => choice.value === value)?.label ?? value
  );
}

function formatDuration(value: number) {
  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
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
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  typeChip: {
    width: '48%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  typeChipSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  choiceLabel: {
    flex: 1,
  },
  intensityGrid: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  intensityChip: {
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  intensitySelected: {
    borderColor: colors.plum,
    backgroundColor: colors.plum,
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
