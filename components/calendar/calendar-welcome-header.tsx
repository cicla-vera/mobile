import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useUserProfileQuery } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/auth.store';
import { colors, spacing } from '@/constants/theme';
import { getWelcomeMessage } from '@/utils/user-name';

export function CalendarWelcomeHeader() {
  const cachedUser = useAuthStore((state) => state.user);
  const profileQuery = useUserProfileQuery();
  const firstNameSource = profileQuery.data?.name ?? cachedUser?.name;

  return (
    <View style={styles.container}>
      <AppText variant="caption" tone="muted" style={styles.eyebrow}>
        seu calendario
      </AppText>
      <AppText variant="heading" style={styles.title}>
        {getWelcomeMessage(firstNameSource)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
  },
});
