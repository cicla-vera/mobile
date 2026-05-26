import { Pressable, StyleSheet } from 'react-native';

import { MoonMark } from '@/components/calendar/moon-mark';

type VeraAccessEntryProps = {
  onPress: () => void;
};

export function VeraAccessEntry({ onPress }: VeraAccessEntryProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir area privada Vera"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [
        styles.entry,
        pressed && styles.entryPressed,
      ]}
    >
      <MoonMark size={36} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  entry: {
    alignSelf: 'flex-start',
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryPressed: {
    opacity: 0.72,
  },
});
