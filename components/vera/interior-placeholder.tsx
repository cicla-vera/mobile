import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/constants/theme';

type InteriorPlaceholderProps = {
  title: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
};

export function InteriorPlaceholder({
  title,
  detail,
  icon,
}: InteriorPlaceholderProps) {
  return (
    <Screen padded={false}>
      <View style={styles.screen}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.cream} />
        </Pressable>

        <View style={styles.content}>
          <View style={styles.mark}>
            <Feather name={icon} size={24} color={colors.cream} />
          </View>
          <AppText variant="label" tone="pink" style={styles.eyebrow}>
            Vera
          </AppText>
          <AppText variant="title" tone="cream" style={styles.title}>
            {title}
          </AppText>
          <AppText style={styles.detail}>{detail}</AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[7],
    backgroundColor: colors.ink,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.16)',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  pressed: {
    opacity: 0.72,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing[16],
  },
  mark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    borderRadius: radius.pill,
    backgroundColor: colors.plum,
  },
  eyebrow: {
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 320,
  },
  detail: {
    maxWidth: 330,
    marginTop: spacing[4],
    color: 'rgba(255, 245, 236, 0.72)',
  },
});
