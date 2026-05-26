import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { MOOD_OPTIONS } from "@/constants/moods";
import { colors, radius, spacing } from "@/constants/theme";
import { useCycleStore } from "@/stores/cycle.store";
import type { MoodOption } from "@/types/calendar.types";

type MoodOptionCardProps = {
  option: MoodOption;
  selected: boolean;
  onPress: () => void;
};

function MoodOptionCard({ option, selected, onPress }: MoodOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.option}
    >
      <View style={[styles.card, selected && styles.cardSelected]}>
        {option.image ? (
          <Image
            source={option.image as ImageSourcePropType}
            style={styles.emoji}
            resizeMode="contain"
          />
        ) : option.icon ? (
          <Feather
            name={option.icon as keyof typeof Feather.glyphMap}
            size={24}
            color={option.iconColor ?? colors.ink}
          />
        ) : null}
      </View>
      <Text
        style={[styles.optionLabel, selected && styles.optionLabelSelected]}
        numberOfLines={2}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

type MoodCheckInProps = {
  dateKey: string;
};

export function MoodCheckIn({ dateKey }: MoodCheckInProps) {
  const moodsByDate = useCycleStore((state) => state.moodsByDate);
  const setMoodForDate = useCycleStore((state) => state.setMoodForDate);
  const clearMoodForDate = useCycleStore((state) => state.clearMoodForDate);

  const selectedMoodId = moodsByDate[dateKey] ?? null;

  function handleSelect(moodId: string) {
    if (selectedMoodId === moodId) {
      clearMoodForDate(dateKey);
      return;
    }

    setMoodForDate(dateKey, moodId);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>COMO VOCÊ ESTÁ HOJE?</Text>
      <View style={styles.optionsRow}>
        {MOOD_OPTIONS.map((option) => (
          <MoodOptionCard
            key={option.id}
            option={option}
            selected={selectedMoodId === option.id}
            onPress={() => handleSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[2],
  },
  title: {
    color: colors.soft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  option: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 56,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.shell,
  },
  emoji: {
    width: 24,
    height: 24,
  },
  optionLabel: {
    marginTop: spacing[1],
    color: colors.ink,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: colors.blue,
    fontWeight: "700",
  },
});
