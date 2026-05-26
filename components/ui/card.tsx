import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';

type CardTone = 'plain' | 'sky' | 'coral' | 'ink';

type CardProps = ViewProps & {
  children: ReactNode;
  tone?: CardTone;
};

const toneStyles: Record<CardTone, { backgroundColor: string }> = {
  plain: { backgroundColor: colors.white },
  sky: { backgroundColor: colors.sky },
  coral: { backgroundColor: colors.coral },
  ink: { backgroundColor: colors.ink },
};

export function Card({ children, tone = 'plain', style, ...props }: CardProps) {
  return (
    <View {...props} style={[styles.base, toneStyles[tone], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing[6],
    borderRadius: radius.md,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
});
