import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  CalendarGrid,
  CalendarHeader,
  CyclePredictionCard,
  MoodCheckIn,
  NotificationsModal,
  PeriodMarkingCard,
} from "@/components/calendar";
import { MOCK_NOTIFICATIONS } from "@/constants/notifications";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useCyclePredictionQuery,
  useCreateCycleMutation,
  useCyclesQuery,
  useUpdateCycleMutation,
} from "@/hooks/useCycles";
import { getApiErrorMessage } from "@/services/api-error";
import { useCycleStore } from "@/stores/cycle.store";
import {
  buildCalendarMonth,
  formatCalendarHeading,
  formatMonthHeading,
} from "@/utils/calendar";
import { buildPeriodDaySet, getCycleStartKey } from "@/utils/cycles";
import { parseDateKey, parseMonthKey } from "@/utils/date";
import { buildPredictionDaySets } from "@/utils/prediction";
import type { CycleLog } from "@/types/api.types";
import type { AppNotification } from "@/constants/notifications";

export default function HomePreviewRoute() {
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const visibleMonth = useCycleStore((state) => state.visibleMonth);
  const selectDate = useCycleStore((state) => state.selectDate);
  const goToToday = useCycleStore((state) => state.goToToday);
  const shiftVisibleMonth = useCycleStore((state) => state.shiftVisibleMonth);

  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [cycleFeedback, setCycleFeedback] = useState<string | null>(null);

  const cyclesQuery = useCyclesQuery();
  const cyclePredictionQuery = useCyclePredictionQuery();
  const createCycleMutation = useCreateCycleMutation();
  const updateCycleMutation = useUpdateCycleMutation();

  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey],
  );
  const { year, month } = useMemo(
    () => parseMonthKey(visibleMonth),
    [visibleMonth],
  );

  const { fertileDays, predictedDays } = useMemo(
    () => buildPredictionDaySets(cyclePredictionQuery.data),
    [cyclePredictionQuery.data],
  );
  const periodDays = useMemo(
    () => buildPeriodDaySet(cyclesQuery.data ?? [], today),
    [cyclesQuery.data, today],
  );

  const weeks = useMemo(
    () =>
      buildCalendarMonth(year, month, {
        today,
        selectedDateKey,
        periodDays,
        fertileDays,
        predictedDays,
      }),
    [
      fertileDays,
      month,
      periodDays,
      predictedDays,
      selectedDateKey,
      today,
      year,
    ],
  );

  const hasUnreadNotifications = notifications.some((item) => !item.read);
  const cycleMutationError =
    createCycleMutation.error ?? updateCycleMutation.error ?? null;
  const cycleErrorMessage = cyclesQuery.isError
    ? getApiErrorMessage(
        cyclesQuery.error,
        "Não deu para carregar seus ciclos agora.",
      )
    : cycleMutationError
      ? getApiErrorMessage(cycleMutationError, "Não deu para salvar o ciclo.")
      : null;
  const isSavingCycle =
    createCycleMutation.isPending || updateCycleMutation.isPending;

  function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }

  function handleMarkRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  async function handleMarkPeriodStart() {
    setCycleFeedback(null);
    createCycleMutation.reset();
    updateCycleMutation.reset();

    try {
      await createCycleMutation.mutateAsync({ startDate: selectedDateKey });
      setCycleFeedback("Início salvo no calendário.");
    } catch {
      setCycleFeedback(null);
    }
  }

  async function handleMarkPeriodEnd(cycle: CycleLog) {
    setCycleFeedback(null);
    createCycleMutation.reset();
    updateCycleMutation.reset();

    try {
      await updateCycleMutation.mutateAsync({
        id: cycle.id,
        payload: {
          startDate: getCycleStartKey(cycle),
          endDate: selectedDateKey,
        },
      });
      setCycleFeedback("Fim salvo no calendário.");
    } catch {
      setCycleFeedback(null);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainSection}>
          <CalendarHeader
            dateLabel={formatCalendarHeading(selectedDate)}
            onNotificationsPress={() => setNotificationsVisible(true)}
            onGoToToday={goToToday}
            hasUnreadNotifications={hasUnreadNotifications}
          />
          <CalendarGrid
            weeks={weeks}
            monthLabel={formatMonthHeading(year, month)}
            selectedDateKey={selectedDateKey}
            onSelectDate={selectDate}
            onPreviousMonth={() => shiftVisibleMonth(-1)}
            onNextMonth={() => shiftVisibleMonth(1)}
            onGoToToday={goToToday}
          />
        </View>

        <CyclePredictionCard
          prediction={cyclePredictionQuery.data}
          loading={cyclePredictionQuery.isLoading}
          error={cyclePredictionQuery.error}
        />

        <PeriodMarkingCard
          selectedDateKey={selectedDateKey}
          cycles={cyclesQuery.data ?? []}
          loading={cyclesQuery.isLoading}
          saving={isSavingCycle}
          errorMessage={cycleErrorMessage}
          feedbackMessage={cycleFeedback}
          onMarkStart={handleMarkPeriodStart}
          onMarkEnd={handleMarkPeriodEnd}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/(exterior)/day",
              params: { date: selectedDateKey },
            })
          }
          style={({ pressed }) => [
            styles.dayDetailsCard,
            pressed && styles.dayDetailsPressed,
          ]}
        >
          <View style={styles.dayDetailsIcon}>
            <Feather name="calendar" size={18} color={colors.cream} />
          </View>
          <View style={styles.dayDetailsCopy}>
            <AppText variant="label">Detalhes do dia</AppText>
            <AppText
              variant="caption"
              tone="muted"
              style={styles.dayDetailsText}
            >
              Veja humor, fluxo, sintomas e notas de {selectedDateKey}.
            </AppText>
          </View>
          <Feather name="chevron-right" size={18} color={colors.soft} />
        </Pressable>

        <MoodCheckIn dateKey={selectedDateKey} />
      </ScrollView>

      <NotificationsModal
        visible={notificationsVisible}
        notifications={notifications}
        onClose={() => setNotificationsVisible(false)}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing[8],
    paddingBottom: spacing[10],
  },
  mainSection: {
    paddingHorizontal: spacing[6],
  },
  dayDetailsCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[5],
    marginHorizontal: spacing[6],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.08)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
  },
  dayDetailsPressed: {
    opacity: 0.72,
  },
  dayDetailsIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.blue,
  },
  dayDetailsCopy: {
    flex: 1,
  },
  dayDetailsText: {
    marginTop: 2,
  },
});
