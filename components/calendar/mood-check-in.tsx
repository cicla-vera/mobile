import { useState } from 'react';
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
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={styles.card}>
        <Image source={image} style={styles.emoji} resizeMode="contain" />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

export function MoodCheckIn() {
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

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
            onPress={() => setSelectedMoodId(option.id)}
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
  optionSelected: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  card: {
    width: 66,
    height: 65,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
});
