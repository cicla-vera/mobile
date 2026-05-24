import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PressableProps & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.blue,
  },
  secondary: {
    backgroundColor: colors.shell,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const labelTone: Record<ButtonVariant, 'cream' | 'ink' | 'blue'> = {
  primary: 'cream',
  secondary: 'ink',
  ghost: 'blue',
};

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
        style?.width === '100%' || style?.alignSelf === 'stretch'
          ? styles.stretch
          : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.cream} />
      ) : (
        <AppText variant="label" tone={labelTone[variant]}>
          {children}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    borderRadius: radius.pill,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
