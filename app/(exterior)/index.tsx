import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  CalendarGrid,
  CalendarHeader,
  CycleInsightCard,
  CyclePeriodCard,
  MoodCheckIn,
  NotificationsModal,
} from '@/components/calendar';
import { MOCK_NOTIFICATIONS } from '@/constants/notifications';
import { Screen } from '@/components/ui/screen';
import { spacing } from '@/constants/theme';
import { useCycleStore } from '@/stores/cycle.store';
import {
  buildCalendarMonth,
  buildMockCycleSets,
  formatCalendarHeading,
  formatMonthHeading,
  getCalendarInsights,
} from '@/utils/calendar';
import { parseDateKey, parseMonthKey } from '@/utils/date';
import type { AppNotification } from '@/constants/notifications';

export default function HomePreviewRoute() {
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const visibleMonth = useCycleStore((state) => state.visibleMonth);
  const selectDate = useCycleStore((state) => state.selectDate);
  const goToToday = useCycleStore((state) => state.goToToday);
  const shiftVisibleMonth = useCycleStore((state) => state.shiftVisibleMonth);

  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(MOCK_NOTIFICATIONS);

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
    () => buildMockCycleSets(new Date(year, month, 1)),
    [month, year],
  );

  const weeks = useMemo(
    () =>
      buildCalendarMonth(year, month, {
        today,
        selectedDateKey,
        fertileDays,
        predictedDays,
      }),
    [fertileDays, month, predictedDays, selectedDateKey, today, year],
  );

  const insights = useMemo(
    () => getCalendarInsights(selectedDate),
    [selectedDate],
  );

  const hasUnreadNotifications = notifications.some((item) => !item.read);

  function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }

  function handleMarkRead(id: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
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

        <CycleInsightCard
          title={insights.fertileMessage}
          description={insights.fertileDetail}
        />

        <CyclePeriodCard title={insights.nextPeriodMessage} />

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
});
