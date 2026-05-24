import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  CalendarGrid,
  CalendarHeader,
  CycleInsightCard,
  CyclePeriodCard,
  MoodCheckIn,
} from '@/components/calendar';
import { Screen } from '@/components/ui/screen';
import { spacing } from '@/constants/theme';
import { useCycleStore } from '@/stores/cycle.store';
import {
  buildCalendarMonth,
  buildMockCycleSets,
  formatCalendarHeading,
  getCalendarInsights,
} from '@/utils/calendar';

export default function HomePreviewRoute() {
  const selectedDateKey = useCycleStore((state) => state.selectedDate);
  const visibleMonth = useCycleStore((state) => state.visibleMonth);
  const setSelectedDate = useCycleStore((state) => state.setSelectedDate);

  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(
    () => new Date(selectedDateKey),
    [selectedDateKey],
  );
  const [year, month] = useMemo(() => {
    const [visibleYear, visibleMonthIndex] = visibleMonth.split('-').map(Number);

    return [visibleYear, visibleMonthIndex - 1];
  }, [visibleMonth]);

  const { fertileDays, predictedDays } = useMemo(
    () => buildMockCycleSets(new Date(year, month, 1)),
    [month, year],
  );

  const weeks = useMemo(
    () =>
      buildCalendarMonth(year, month, {
        today,
        fertileDays,
        predictedDays,
      }),
    [fertileDays, month, predictedDays, today, year],
  );

  const insights = useMemo(
    () => getCalendarInsights(selectedDate),
    [selectedDate],
  );

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainSection}>
          <CalendarHeader dateLabel={formatCalendarHeading(selectedDate)} />
          <CalendarGrid weeks={weeks} onSelectDate={setSelectedDate} />
        </View>

        <CycleInsightCard
          title={insights.fertileMessage}
          description={insights.fertileDetail}
        />

        <CyclePeriodCard title={insights.nextPeriodMessage} />

        <MoodCheckIn />
      </ScrollView>
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
