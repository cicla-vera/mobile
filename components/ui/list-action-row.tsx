import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/constants/theme';

type ListActionRowProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  variant?: 'card' | 'footer';
  style?: ViewStyle;
};

export function ListActionRow({
  title,
  description,
  icon,
  onPress,
  variant = 'card',
  style,
}: ListActionRowProps) {
  const isFooter = variant === 'footer';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        isFooter ? styles.footer : styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? (
          <View style={styles.icon}>
            <Feather name={icon} size={17} color={colors.blue} />
          </View>
        ) : null}

        <View style={[styles.copy, isFooter && !description && styles.footerCopy]}>
          <AppText
            variant="label"
            tone={isFooter ? 'blue' : undefined}
            numberOfLines={isFooter ? 1 : 2}
            style={isFooter ? styles.footerTitle : undefined}
          >
            {title}
          </AppText>
          {description ? (
            <AppText variant="caption" tone="muted" style={styles.description}>
              {description}
            </AppText>
          ) : null}
        </View>

        <View style={styles.trailing}>
          <Feather
            name="chevron-right"
            size={18}
            color={isFooter ? colors.blue : colors.soft}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  footer: {
    width: '100%',
    paddingTop: spacing[4],
    paddingBottom: spacing[1],
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 16, 17, 0.06)',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing[3],
  },
  pressed: {
    opacity: 0.72,
  },
  icon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.shell,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
    gap: spacing[1],
  },
  footerCopy: {
    flex: 1,
  },
  footerTitle: {
    textTransform: 'none',
  },
  description: {
    lineHeight: 17,
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
