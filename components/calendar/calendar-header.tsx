import { StyleSheet, View } from "react-native";

import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/constants/theme";

type CalendarHeaderProps = {
  dateLabel: string;
  onGoToToday: () => void;
};

export function CalendarHeader({ dateLabel, onGoToToday }: CalendarHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="caption" tone="muted" style={styles.eyebrow}>
        seu calendario
      </AppText>
      <View style={styles.header}>
        <AppText style={styles.date}>{dateLabel}</AppText>
        <CalendarToolbar onGoToToday={onGoToToday} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  eyebrow: {
    textTransform: "uppercase",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 58,
    paddingBottom: spacing[1],
  },
  date: {
    fontSize: 16,
    lineHeight: 29,
    fontWeight: "400",
  },
});
