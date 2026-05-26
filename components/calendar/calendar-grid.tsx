import { StyleSheet, Text, View } from "react-native";

import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";
import { CalendarMonthNav } from "@/components/calendar/calendar-month-nav";
import type { CalendarDay } from "@/types/calendar.types";
import { colors, spacing } from "@/constants/theme";
import { getWeekDayLabels } from "@/utils/calendar";

type CalendarGridProps = {
  weeks: CalendarDay[][];
  monthLabel: string;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
};

export function CalendarGrid({
  weeks,
  monthLabel,
  selectedDateKey,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
}: CalendarGridProps) {
  const weekDays = getWeekDayLabels();

  return (
    <View style={styles.calendar}>
      <View style={styles.topDivider} />

      <CalendarMonthNav
        label={monthLabel}
        onPrevious={onPreviousMonth}
        onNext={onNextMonth}
        onToday={onGoToToday}
      />

      <View style={styles.weekRow}>
        {weekDays.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.weekDivider} />

      {weeks.map((week) => (
        <View
          key={week[0]?.key ?? week.map((day) => day.key).join("-")}
          style={styles.dayRow}
        >
          {week.map((day) => (
            <CalendarDayCell
              key={day.key}
              label={day.label}
              variant={day.variant}
              selected={day.key === selectedDateKey}
              onPress={() => onSelectDate(day.key)}
            />
          ))}
        </View>
      ))}

      <View style={styles.bottomDivider} />
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    marginTop: 0,
  },
  topDivider: {
    height: 1,
    backgroundColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.31,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: spacing[2] + 2,
  },
  bottomDivider: {
    height: 1,
    marginTop: spacing[1],
    backgroundColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32,
    shadowRadius: 4,
    elevation: 2,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[2],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[8] + 1,
  },
  weekDay: {
    width: 28,
    color: colors.ink,
    fontSize: 8,
    lineHeight: 15,
    textAlign: "center",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[8] + 1,
  },
});
