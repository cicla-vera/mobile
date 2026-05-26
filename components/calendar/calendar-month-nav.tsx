import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors, spacing } from "@/constants/theme";

type CalendarMonthNavProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarMonthNav({
  label,
  onPrevious,
  onNext,
  onToday,
}: CalendarMonthNavProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mês anterior"
        onPress={onPrevious}
        style={styles.navButton}
      >
        <Feather name="chevron-left" size={22} color={colors.ink} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para hoje"
        onPress={onToday}
        style={styles.labelButton}
      >
        <AppText style={styles.label}>{label}</AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Próximo mês"
        onPress={onNext}
        style={styles.navButton}
      >
        <Feather name="chevron-right" size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.shell,
  },
  labelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing[2],
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.coffee,
  },
});
