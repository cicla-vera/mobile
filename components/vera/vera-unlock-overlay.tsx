import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { VeraLogo } from '@/components/brand/vera-logo';
import { AppText } from '@/components/ui/app-text';
import { colors, iconSize, spacing, touchTarget } from '@/constants/theme';

const PIN_SLOT_COUNT = 4;

type VeraUnlockOverlayProps = {
  pin: string;
  pinError?: string | null;
  pinPending: boolean;
  biometricAvailable: boolean;
  biometricPending: boolean;
  biometricMessage?: string | null;
  onBack: () => void;
  onPinChange: (value: string) => void;
  onPinSubmit: () => void;
  onBiometricPress: () => void;
  pinMaxLength: number;
};

export function VeraUnlockOverlay({
  pin,
  pinError,
  pinPending,
  biometricAvailable,
  biometricPending,
  biometricMessage,
  onBack,
  onPinChange,
  onPinSubmit,
  onBiometricPress,
  pinMaxLength,
}: VeraUnlockOverlayProps) {
  const pinInputRef = useRef<TextInput>(null);
  const showPinCursor = pin.length === 0 && !pinPending;
  const slotCount = Math.max(PIN_SLOT_COUNT, pin.length);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.backdrop} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather color={colors.ink} name="arrow-left" size={iconSize.md} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing[4] : 0}
        style={styles.body}
      >
        <View style={styles.topSection}>
          <VeraLogo width={150} style={styles.logo} />

          <AppText style={styles.title}>Digite seu PIN</AppText>

          <Pressable
            accessibilityLabel="Campo de PIN Vera"
            accessibilityRole="button"
            disabled={pinPending || biometricPending}
            onPress={() => pinInputRef.current?.focus()}
            style={styles.pinArea}
          >
            <TextInput
              ref={pinInputRef}
              accessibilityLabel="PIN Vera"
              autoComplete="off"
              autoFocus
              caretHidden
              editable={!pinPending && !biometricPending}
              importantForAutofill="no"
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={pinMaxLength}
              onChangeText={onPinChange}
              onSubmitEditing={onPinSubmit}
              returnKeyType="done"
              secureTextEntry
              selectionColor="transparent"
              style={styles.pinInput}
              textContentType="oneTimeCode"
              value={pin}
            />

            {pinPending ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : showPinCursor ? (
              <View style={styles.pinCursor} />
            ) : (
              <View style={styles.pinDots}>
                {Array.from({ length: slotCount }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      index < pin.length
                        ? styles.pinDotFilled
                        : styles.pinDotEmpty,
                    ]}
                  />
                ))}
              </View>
            )}
          </Pressable>

          {pinError ? (
            <AppText style={styles.errorText} variant="caption">
              {pinError}
            </AppText>
          ) : null}
        </View>

        <View style={styles.biometricSection}>
          <Pressable
            accessibilityHint="Desbloqueia o Vera com biometria"
            accessibilityLabel="Usar biometria"
            accessibilityRole="button"
            disabled={!biometricAvailable || biometricPending || pinPending}
            onPress={onBiometricPress}
            style={({ pressed }) => [
              styles.biometricButton,
              (!biometricAvailable || biometricPending || pinPending) &&
                styles.biometricButtonDisabled,
              pressed &&
                biometricAvailable &&
                !biometricPending &&
                !pinPending &&
                styles.pressed,
            ]}
          >
            {biometricPending ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : (
              <MaterialIcons
                color={biometricAvailable ? colors.blue : colors.soft}
                name="fingerprint"
                size={40}
              />
            )}
          </Pressable>

          {biometricMessage ? (
            <AppText style={styles.biometricMessage} tone="muted" variant="caption">
              {biometricMessage}
            </AppText>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.shell,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 245, 236, 0.81)',
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: touchTarget.min / 2,
    height: touchTarget.min,
    justifyContent: 'center',
    width: touchTarget.min,
  },
  pressed: {
    opacity: 0.72,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  logo: {
    marginBottom: spacing[8],
  },
  title: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  pinArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[6],
    minHeight: 72,
    width: '100%',
  },
  pinInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    fontSize: 24,
    opacity: 0.01,
    textAlign: 'center',
  },
  pinCursor: {
    backgroundColor: colors.blue,
    borderRadius: 2,
    height: 63,
    width: 3,
  },
  pinDots: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
  },
  pinDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  pinDotFilled: {
    backgroundColor: colors.blue,
  },
  pinDotEmpty: {
    backgroundColor: 'rgba(32, 37, 123, 0.18)',
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing[3],
    maxWidth: 280,
    textAlign: 'center',
  },
  biometricSection: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: spacing[12],
    width: '100%',
  },
  biometricButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  biometricButtonDisabled: {
    opacity: 0.55,
  },
  biometricMessage: {
    marginTop: spacing[3],
    maxWidth: 280,
    textAlign: 'center',
  },
});
