import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import {
  DEFAULT_SYMPTOMS,
  FLOW_CHOICES,
  MOOD_CHOICES,
} from '@/constants/daily-log';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import {
  useAvailableSymptomsQuery,
  useDailyLogQuery,
  useSaveDailyLogMutation,
} from '@/hooks/useDailyLog';
import { getApiErrorMessage } from '@/services/api-error';
import { useCycleStore } from '@/stores/cycle.store';
import type { FlowIntensity, MoodType } from '@/types/api.types';
import { formatCalendarHeading } from '@/utils/calendar';
import { parseDateKey } from '@/utils/date';

type SelectedSymptoms = Record<string, number>;

const intensityOptions = [1, 2, 3, 4, 5] as const;

export default function DailyLogRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const selectDate = useCycleStore((state) => state.selectDate);
  const goToToday = useCycleStore((state) => state.goToToday);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptoms>(
    {},
  );
  const [note, setNote] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const dailyLogQuery = useDailyLogQuery(selectedDateKey);
  const availableSymptomsQuery = useAvailableSymptomsQuery();
  const saveDailyLogMutation = useSaveDailyLogMutation();

  useEffect(() => {
    if (
      typeof params.date === 'string' &&
      isDateKey(params.date) &&
      params.date !== selectedDateKey
    ) {
      selectDate(params.date);
    }
  }, [params.date, selectDate, selectedDateKey]);

  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey],
  );

  useEffect(() => {
    setSelectedMood(null);
    setSelectedFlow(null);
    setSelectedSymptoms({});
    setNote('');
    setDraftError(null);
    setSavedMessage(null);
  }, [selectedDateKey]);

  const symptomOptions = useMemo(() => {
    const seen = new Set<string>();
    const names = [
      ...DEFAULT_SYMPTOMS,
      ...(availableSymptomsQuery.data?.map((symptom) => symptom.name) ?? []),
    ];

    return names.filter((name) => {
      const key = name.trim().toLowerCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [availableSymptomsQuery.data]);

  const selectedSymptomNames = Object.keys(selectedSymptoms);
  const hasDraft =
    selectedMood !== null ||
    selectedFlow !== null ||
    selectedSymptomNames.length > 0 ||
    note.trim().length > 0;
  const saveError = saveDailyLogMutation.error
    ? getApiErrorMessage(
        saveDailyLogMutation.error,
        'Não deu para salvar o registro.',
      )
    : null;
  const loadError = dailyLogQuery.error
    ? getApiErrorMessage(
        dailyLogQuery.error,
        'Não deu para carregar os registros deste dia.',
      )
    : null;

  function toggleSymptom(name: string) {
    setDraftError(null);
    setSavedMessage(null);
    setSelectedSymptoms((current) => {
      if (current[name]) {
        const next = { ...current };
        delete next[name];
        return next;
      }

      return { ...current, [name]: 3 };
    });
  }

  function updateSymptomIntensity(name: string, intensity: number) {
    setSelectedSymptoms((current) => ({
      ...current,
      [name]: intensity,
    }));
  }

  async function handleSave() {
    setSavedMessage(null);
    saveDailyLogMutation.reset();

    if (!hasDraft) {
      setDraftError('Escolha pelo menos um item para salvar.');
      return;
    }

    setDraftError(null);

    try {
      await saveDailyLogMutation.mutateAsync({
        date: selectedDateKey,
        mood: selectedMood,
        flowIntensity: selectedFlow,
        symptoms: selectedSymptomNames.map((symptomName) => ({
          symptomName,
          intensity: selectedSymptoms[symptomName],
        })),
        note,
      });

      setSelectedMood(null);
      setSelectedFlow(null);
      setSelectedSymptoms({});
      setNote('');
      setSavedMessage('Registro salvo para este dia.');
    } catch {
      setSavedMessage(null);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
              Registro diário
            </AppText>
            <AppText variant="heading" style={styles.title}>
              {formatCalendarHeading(selectedDate)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir para hoje"
            onPress={goToToday}
            style={styles.todayButton}
          >
            <AppText variant="caption" tone="blue" style={styles.todayLabel}>
              Hoje
            </AppText>
          </Pressable>
        </View>

        <AppText tone="muted" style={styles.lead}>
          Salve sinais do dia em poucos toques. Tudo fica ligado ao calendário e
          sincronizado com sua conta.
        </AppText>

        <View style={styles.section}>
          <SectionTitle title="Humor" detail="como o dia está batendo" />
          <View style={styles.moodGrid}>
            {MOOD_CHOICES.map((mood) => (
              <Pressable
                key={mood.value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedMood === mood.value }}
                onPress={() => {
                  setDraftError(null);
                  setSavedMessage(null);
                  setSelectedMood((current) =>
                    current === mood.value ? null : mood.value,
                  );
                }}
                style={[
                  styles.moodChip,
                  selectedMood === mood.value && styles.chipSelected,
                ]}
              >
                <View
                  style={[styles.moodDot, { backgroundColor: mood.accent }]}
                />
                <AppText variant="caption" style={styles.chipText}>
                  {mood.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="Fluxo" detail="se houver hoje" />
          <View style={styles.flowGrid}>
            {FLOW_CHOICES.map((flow) => (
              <Pressable
                key={flow.value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedFlow === flow.value }}
                onPress={() => {
                  setDraftError(null);
                  setSavedMessage(null);
                  setSelectedFlow((current) =>
                    current === flow.value ? null : flow.value,
                  );
                }}
                style={[
                  styles.flowChip,
                  selectedFlow === flow.value && styles.flowSelected,
                ]}
              >
                <AppText
                  variant="label"
                  tone={selectedFlow === flow.value ? 'cream' : 'ink'}
                  style={styles.flowLabel}
                >
                  {flow.label}
                </AppText>
                <AppText
                  variant="caption"
                  tone={selectedFlow === flow.value ? 'cream' : 'muted'}
                  style={styles.flowDescription}
                >
                  {flow.description}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Sintomas"
            detail="toque para escolher, depois ajuste a intensidade"
          />
          <View style={styles.symptomGrid}>
            {symptomOptions.map((name) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(selectedSymptoms[name]) }}
                onPress={() => toggleSymptom(name)}
                style={[
                  styles.symptomChip,
                  Boolean(selectedSymptoms[name]) && styles.chipSelected,
                ]}
              >
                <AppText
                  variant="caption"
                  tone={selectedSymptoms[name] ? 'blue' : 'ink'}
                  style={styles.chipText}
                >
                  {name}
                </AppText>
              </Pressable>
            ))}
          </View>

          {selectedSymptomNames.length > 0 ? (
            <View style={styles.intensityList}>
              {selectedSymptomNames.map((name) => (
                <View key={name} style={styles.intensityRow}>
                  <AppText variant="caption" style={styles.intensityName}>
                    {name}
                  </AppText>
                  <View style={styles.intensityButtons}>
                    {intensityOptions.map((value) => (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={`Intensidade ${value}`}
                        accessibilityState={{
                          selected: selectedSymptoms[name] === value,
                        }}
                        onPress={() => updateSymptomIntensity(name, value)}
                        style={[
                          styles.intensityButton,
                          selectedSymptoms[name] === value &&
                            styles.intensitySelected,
                        ]}
                      >
                        <AppText
                          variant="caption"
                          tone={
                            selectedSymptoms[name] === value ? 'cream' : 'ink'
                          }
                          style={styles.intensityLabel}
                        >
                          {value}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Nota" detail="um pensamento, dor ou contexto" />
          <TextInput
            multiline
            value={note}
            onChangeText={(value) => {
              setDraftError(null);
              setSavedMessage(null);
              setNote(value);
            }}
            placeholder="Nota do dia..."
            placeholderTextColor={colors.soft}
            style={styles.noteInput}
            textAlignVertical="top"
          />
        </View>

        {draftError || saveError ? (
          <AppText variant="caption" style={styles.error}>
            {draftError ?? saveError}
          </AppText>
        ) : null}

        {savedMessage ? (
          <AppText variant="caption" style={styles.success}>
            {savedMessage}
          </AppText>
        ) : null}

        <Button
          loading={saveDailyLogMutation.isPending}
          disabled={!hasDraft || saveDailyLogMutation.isPending}
          onPress={handleSave}
          style={styles.saveButton}
        >
          Salvar registro
        </Button>

        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <AppText variant="label">Já registrado</AppText>
            {dailyLogQuery.isFetching ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : null}
          </View>

          {loadError ? (
            <AppText variant="caption" style={styles.error}>
              {loadError}
            </AppText>
          ) : (
            <DailyLogSummary data={dailyLogQuery.data} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="label">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {detail}
      </AppText>
    </View>
  );
}

function DailyLogSummary({
  data,
}: {
  data:
    | {
        moods: Array<{ mood: MoodType }>;
        flow: Array<{ intensity: FlowIntensity }>;
        symptoms: Array<{ symptom: { name: string }; intensity: number | null }>;
        notes: Array<{ content: string }>;
      }
    | undefined;
}) {
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
      <AppText variant="caption" tone="muted">
        Nada salvo para esse dia ainda.
      </AppText>
    );
  }

  return (
    <View style={styles.summaryList}>
      {moods.map((entry, index) => (
        <SummaryLine
          key={`mood-${index}`}
          icon="smile"
          label={getMoodLabel(entry.mood)}
        />
      ))}
      {flow.map((entry, index) => (
        <SummaryLine
          key={`flow-${index}`}
          icon="droplet"
          label={getFlowLabel(entry.intensity)}
        />
      ))}
      {symptoms.map((entry, index) => (
        <SummaryLine
          key={`symptom-${entry.symptom.name}-${index}`}
          icon="activity"
          label={`${entry.symptom.name}${
            entry.intensity ? ` - intensidade ${entry.intensity}` : ''
          }`}
        />
      ))}
      {notes.map((entry, index) => (
        <SummaryLine key={`note-${index}`} icon="edit-3" label={entry.content} />
      ))}
    </View>
  );
}

function SummaryLine({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.summaryLine}>
      <Feather name={icon} size={22} color={colors.blue} />
      <AppText variant="caption" style={styles.summaryText}>
        {label}
      </AppText>
    </View>
  );
}

function getMoodLabel(value: MoodType) {
  return MOOD_CHOICES.find((mood) => mood.value === value)?.label ?? value;
}

function getFlowLabel(value: FlowIntensity) {
  return FLOW_CHOICES.find((flow) => flow.value === value)?.label ?? value;
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
    minHeight: 52,
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
  todayButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  todayLabel: {
    fontWeight: '800',
  },
  lead: {
    marginTop: spacing[3],
    maxWidth: 330,
  },
  section: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    gap: 2,
    marginBottom: spacing[4],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  moodChip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.09)',
    backgroundColor: colors.white,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipSelected: {
    borderColor: 'rgba(32, 37, 123, 0.42)',
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  chipText: {
    fontWeight: '800',
  },
  flowGrid: {
    gap: spacing[2],
  },
  flowChip: {
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.09)',
    backgroundColor: colors.white,
  },
  flowSelected: {
    borderColor: colors.pink,
    backgroundColor: colors.pink,
  },
  flowLabel: {
    fontSize: 14,
  },
  flowDescription: {
    marginTop: 1,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  symptomChip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.09)',
    backgroundColor: colors.white,
  },
  intensityList: {
    gap: spacing[3],
    marginTop: spacing[4],
  },
  intensityRow: {
    gap: spacing[2],
  },
  intensityName: {
    fontWeight: '800',
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  intensityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 17, 0.06)',
  },
  intensitySelected: {
    backgroundColor: colors.blue,
  },
  intensityLabel: {
    fontWeight: '900',
  },
  noteInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.1)',
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  error: {
    marginTop: spacing[3],
    color: colors.danger,
  },
  success: {
    marginTop: spacing[3],
    color: colors.blue,
  },
  saveButton: {
    marginTop: spacing[6],
    alignSelf: 'stretch',
  },
  summary: {
    marginTop: spacing[6],
    padding: spacing[5],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
  },
  summaryHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  summaryList: {
    gap: spacing[2],
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  summaryText: {
    flex: 1,
  },
});
