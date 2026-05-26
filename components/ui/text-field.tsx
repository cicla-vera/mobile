import { forwardRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <View style={styles.wrapper}>
        <AppText variant="label" tone="muted" style={styles.label}>
          {label}
        </AppText>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.soft}
          style={[styles.input, error && styles.inputError, style]}
          {...props}
        />
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[2],
    minWidth: 0,
  },
  label: {
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.1)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === 'android' ? spacing[2] : spacing[3],
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
  },
});
