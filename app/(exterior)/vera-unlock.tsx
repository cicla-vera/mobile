import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { colors, spacing } from '@/constants/theme';
import { useVerifyVeraPinMutation } from '@/hooks/vera';
import { getApiErrorMessage } from '@/services/api-error';
import { isVeraSessionValid, useVeraStore } from '@/stores/vera.store';

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

export default function VeraUnlockRoute() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const verifyPinMutation = useVerifyVeraPinMutation();
  const [pin, setPin] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasValidSession = isVeraSessionValid({
    isUnlocked,
    sessionExpiresAt,
    veraSessionToken,
  });

  if (hasValidSession) {
    return <Redirect href="/(interior)" />;
  }

  const pinError =
    validationError ??
    (verifyPinMutation.error
      ? getApiErrorMessage(
          verifyPinMutation.error,
          'Nao deu para desbloquear agora.',
        )
      : undefined);
  const canSubmit =
    pin.length >= PIN_MIN_LENGTH && !verifyPinMutation.isPending;

  function handlePinChange(value: string) {
    setPin(value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH));
    setValidationError(null);
    verifyPinMutation.reset();
  }

  async function handleSubmit() {
    if (pin.length < PIN_MIN_LENGTH) {
      setValidationError('Digite entre 4 e 8 numeros.');
      return;
    }

    try {
      await verifyPinMutation.mutateAsync({ pin });
      setPin('');
      router.replace('/(interior)');
    } catch {
      setPin('');
    }
  }

  return (
    <Screen style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.replace('/(exterior)')}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Feather name="arrow-left" size={20} color={colors.ink} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View>
          <View style={styles.lockMark}>
            <Feather name="lock" size={22} color={colors.cream} />
          </View>

          <AppText variant="heading" style={styles.title}>
            Acesso privado
          </AppText>
          <AppText tone="muted" style={styles.copy}>
            Use seu PIN Vera para continuar.
          </AppText>
        </View>

        <View style={styles.form}>
          <TextField
            accessibilityLabel="PIN Vera"
            autoComplete="off"
            error={pinError}
            inputMode="numeric"
            keyboardType="number-pad"
            label="PIN Vera"
            maxLength={PIN_MAX_LENGTH}
            onChangeText={handlePinChange}
            onSubmitEditing={handleSubmit}
            placeholder="0000"
            returnKeyType="done"
            secureTextEntry
            value={pin}
          />

          <Button
            accessibilityRole="button"
            disabled={!canSubmit}
            loading={verifyPinMutation.isPending}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Entrar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing[16],
  },
  lockMark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    borderRadius: 28,
    backgroundColor: colors.ink,
  },
  title: {
    maxWidth: 280,
  },
  copy: {
    maxWidth: 300,
    marginTop: spacing[3],
  },
  form: {
    marginTop: spacing[8],
    gap: spacing[4],
  },
  submitButton: {
    alignSelf: 'stretch',
  },
});
