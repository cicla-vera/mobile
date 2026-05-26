import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { IMPORT_SOURCES } from '@/constants/import-sources';
import { colors, radius, spacing } from '@/constants/theme';

export function ImportSourceGrid() {
  return (
    <View style={styles.grid}>
      {IMPORT_SOURCES.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() =>
            router.push({
              pathname: '/(exterior)/data-import',
              params: { source: item.source },
            })
          }
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
          ]}
        >
          <View style={styles.icon}>
            <Feather name={item.icon} size={16} color={colors.blue} />
          </View>
          <AppText variant="caption" style={styles.label}>
            {item.shortLabel}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  item: {
    flex: 1,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  itemPressed: {
    opacity: 0.72,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  label: {
    textAlign: 'center',
  },
});
