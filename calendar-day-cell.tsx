import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CalendarDayVariant } from "@/types/calendar.types";
import { colors } from "@/constants/theme";

type CalendarDayCellProps = {
  label: string;
  variant?: CalendarDayVariant;
  selected?: boolean;
  onPress?: () => void;
};

type VariantStyle = {
  marker?: object;
  label?: object;
  showTodayLabel?: boolean;
};

const variantStyles: Record<CalendarDayVariant, VariantStyle> = {
  default: {},
  mutedPrev: {
    label: {
      color: colors.sky,
      opacity: 0.5,
    },
  },
  mutedNext: {
    label: {
      color: colors.ink,
      opacity: 0.5,
    },
  },
  period: {
    marker: {
      backgroundColor: colors.pink,
    },
    label: {
      color: colors.white,
      fontWeight: "500",
    },
  },
  fertile: {
    marker: {
      backgroundColor: colors.coral,
    },
    label: {
      color: colors.white,
      fontWeight: "400",
    },
  },
  today: {
    marker: {
      backgroundColor: "rgba(185, 185, 185, 0.5)",
    },
    label: {
      fontWeight: "700",
    },
    showTodayLabel: true,
  },
  predicted: {
    marker: {
      borderWidth: 1,
      borderColor: "rgba(32, 158, 208, 0.5)",
      borderStyle: "dashed",
      backgroundColor: "transparent",
    },
  },
};

export function CalendarDayCell({
  label,
  variant = "default",
  selected = false,
  onPress,
}: CalendarDayCellProps) {
  const stylesForVariant = variantStyles[variant];
  const hasMarker = Boolean(stylesForVariant.marker);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <View style={[styles.cell, selected && styles.cellSelected]}>
        {hasMarker ? (
          <View style={[styles.marker, stylesForVariant.marker]} />
        ) : null}
        {selected ? <View style={styles.selectedRing} /> : null}
        <Text
          style={[
            styles.label,
            stylesForVariant.label,
            selected && styles.labelSelected,
          ]}
        >
          {label}
        </Text>
      </View>
      {stylesForVariant.showTodayLabel ? (
        <Text style={styles.todayLabel}>Hoje</Text>
      ) : (
        <View style={styles.todaySpacer} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 32,
    alignItems: "center",
  },
  cell: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    transform: [{ scale: 1.04 }],
  },
  marker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedRing: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.blue,
  },
  label: {
    color: colors.ink,
    fontSize: 10,
    lineHeight: 16,
    zIndex: 1,
  },
  labelSelected: {
    fontWeight: "800",
  },
  todayLabel: {
    marginTop: 1,
    color: colors.ink,
    fontSize: 6,
    lineHeight: 9,
  },
  todaySpacer: {
    height: 10,
  },
  pressed: {
    opacity: 0.85,
  },
});
