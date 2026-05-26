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
      </View>
      <CalendarToolbar onGoToToday={onGoToToday} />
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
    minHeight: 32,
  },
  date: {
    fontSize: 16,
    lineHeight: 29,
    fontWeight: "400",
  },
});
