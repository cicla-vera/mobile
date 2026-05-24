import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, spacing } from '@/constants/theme';

type UnderlineFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export const UnderlineField = forwardRef<TextInput, UnderlineFieldProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <View style={styles.wrapper}>
        <AppText style={styles.label}>{label}</AppText>
        <View style={styles.inputRow}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.soft}
            style={[styles.input, style]}
            {...props}
          />
        </View>
        <View style={[styles.underline, error && styles.underlineError]} />
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

UnderlineField.displayName = 'UnderlineField';

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[1],
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.coffee,
  },
  inputRow: {
    minHeight: 28,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    margin: 0,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    fontWeight: '500',
  },
  underline: {
    height: 1,
    backgroundColor: 'rgba(20, 16, 17, 0.18)',
  },
  underlineError: {
    backgroundColor: colors.danger,
  },
  error: {
    color: colors.danger,
    marginTop: spacing[1],
  },
});
