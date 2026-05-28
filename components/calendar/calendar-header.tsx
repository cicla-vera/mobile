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
        seu calendário
      </AppText>
      <View style={styles.headerRow}>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  date: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 29,
    fontWeight: "400",
  },
});
