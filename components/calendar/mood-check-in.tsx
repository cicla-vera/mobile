import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { MOOD_OPTIONS } from '@/constants/moods';
import { colors, radius, spacing } from '@/constants/theme';
import { useCycleStore } from '@/stores/cycle.store';

type MoodOptionCardProps = {
  label: string;
  image: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
};

function MoodOptionCard({
  label,
  image,
  selected,
  onPress,
}: MoodOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.option}
    >
      <View style={[styles.card, selected && styles.cardSelected]}>
        <Image source={image} style={styles.emoji} resizeMode="contain" />
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
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
            label={option.label}
            image={option.image}
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
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
  },
  title: {
    color: colors.soft,
    fontSize: 16,
    lineHeight: 29,
    fontWeight: '400',
    marginBottom: spacing[4],
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    width: 66,
    alignItems: 'center',
  },
  card: {
    width: 66,
    height: 65,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
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
    fontSize: 10,
    lineHeight: 18,
  },
  optionLabelSelected: {
    color: colors.blue,
    fontWeight: '700',
  },
});
