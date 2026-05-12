import type { ReactNode } from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';

import { colors, typography } from '@/constants/theme';

type AppTextVariant = keyof typeof typography;
type AppTextTone = 'ink' | 'muted' | 'soft' | 'cream' | 'blue' | 'pink';

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: AppTextVariant;
  tone?: AppTextTone;
};

const toneStyles: Record<AppTextTone, { color: string }> = {
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  soft: { color: colors.soft },
  cream: { color: colors.cream },
  blue: { color: colors.blue },
  pink: { color: colors.pink },
};

export function AppText({
  children,
  variant = 'body',
  tone = 'ink',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[styles.base, typography[variant], toneStyles[tone], style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});
