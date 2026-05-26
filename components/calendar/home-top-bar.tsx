import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { VeraAccessEntry } from '@/components/calendar/vera-access-entry';
import { colors, radius, spacing } from '@/constants/theme';

type HomeTopBarProps = {
  onVeraPress: () => void;
  onNotificationsPress: () => void;
  hasUnreadNotifications?: boolean;
};

export function HomeTopBar({
  onVeraPress,
  onNotificationsPress,
  hasUnreadNotifications = false,
}: HomeTopBarProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <VeraAccessEntry onPress={onVeraPress} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificacoes"
          hitSlop={8}
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather name="bell" size={24} color={colors.ink} />
          {hasUnreadNotifications ? <View style={styles.badge} /> : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Configuracoes"
          hitSlop={8}
          onPress={() => router.push('/(exterior)/settings')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather name="settings" size={24} color={colors.ink} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil"
          hitSlop={8}
          onPress={() => router.push('/(exterior)/profile')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather name="user" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.72,
  },
});
