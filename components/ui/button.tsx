import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
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
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
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

const indicatorColor: Record<ButtonVariant, string> = {
  primary: colors.cream,
  secondary: colors.blue,
  ghost: colors.blue,
};

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isStretch =
    style?.width === '100%' || style?.alignSelf === 'stretch';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        isStretch && styles.stretch,
        style,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.base,
          variantStyles[variant],
          isDisabled && styles.disabled,
          isStretch && styles.fill,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={indicatorColor[variant]} />
        ) : (
          <AppText variant="label" tone={labelTone[variant]} style={styles.label}>
            {children}
          </AppText>
        )}
      </View>
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
    width: '100%',
  },
  fill: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    textAlign: 'center',
  },
});
