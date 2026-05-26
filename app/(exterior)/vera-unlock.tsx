import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useVeraProfileQuery, useVerifyVeraPinMutation } from '@/hooks/vera';
import { getApiErrorMessage } from '@/services/api-error';
import {
  getVeraBiometricUnlockAvailability,
  storeVeraSessionForBiometricUnlock,
  unlockStoredVeraSessionWithBiometrics,
  type VeraBiometricUnlockReason,
} from '@/services/vera';
import { isVeraSessionValid, useVeraStore } from '@/stores/vera.store';

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

export default function VeraUnlockRoute() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const unlockVeraSession = useVeraStore((state) => state.unlockVeraSession);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const profileQuery = useVeraProfileQuery();
  const verifyPinMutation = useVerifyVeraPinMutation();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricPending, setBiometricPending] = useState(false);
  const [biometricReason, setBiometricReason] =
    useState<VeraBiometricUnlockReason | null>(null);
  const [pin, setPin] = useState('');
  const [pinPending, setPinPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasValidSession = isVeraSessionValid({
    isUnlocked,
    sessionExpiresAt,
    veraSessionToken,
  });
  const biometricMessage = useMemo(
    () => getBiometricMessage(biometricReason),
    [biometricReason],
  );

  useEffect(() => {
    let active = true;

    void getVeraBiometricUnlockAvailability()
      .then((availability) => {
        if (!active) {
          return;
        }

        setBiometricAvailable(availability.available);
        setBiometricReason(availability.reason ?? null);
      })
      .catch(() => {
        if (active) {
          setBiometricAvailable(false);
          setBiometricReason('biometric_storage_unavailable');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (profileQuery.isLoading) {
    return (
      <Screen style={styles.loadingScreen}>
        <ActivityIndicator color={colors.blue} size="large" />
      </Screen>
    );
  }

  if (profileQuery.data && !profileQuery.data.consentAccepted) {
    return <Redirect href="/(exterior)/vera-consent" />;
  }

  if (hasValidSession) {
    return <Redirect href="/(interior)" />;
  }

  const profileError = profileQuery.isError
    ? getApiErrorMessage(
        profileQuery.error,
        'Nao deu para confirmar seu consentimento Vera agora.',
      )
    : null;
  const pinError =
    profileError ??
    validationError ??
    (verifyPinMutation.error
      ? getApiErrorMessage(
          verifyPinMutation.error,
          'Nao deu para desbloquear agora.',
        )
      : undefined);
  const canSubmit =
    !profileError &&
    pin.length >= PIN_MIN_LENGTH &&
    !pinPending &&
    !biometricPending;

  function handlePinChange(value: string) {
    setPin(value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH));
    setValidationError(null);
    if (biometricAvailable) {
      setBiometricReason(null);
    }
    verifyPinMutation.reset();
  }

  async function handleSubmit() {
    if (pinPending || biometricPending || profileError) {
      return;
    }

    if (pin.length < PIN_MIN_LENGTH) {
      setValidationError('Digite entre 4 e 8 numeros.');
      return;
    }

    setPinPending(true);

    try {
      const session = await verifyPinMutation.mutateAsync({ pin });
      await storeVeraSessionForBiometricUnlock(session);
      setPin('');
      router.replace('/(interior)');
    } catch {
      setPin('');
    } finally {
      setPinPending(false);
    }
  }

  async function handleBiometricUnlock() {
    if (profileError) {
      return;
    }

    setBiometricPending(true);
    setBiometricReason(null);
    verifyPinMutation.reset();
    setValidationError(null);

    try {
      const result = await unlockStoredVeraSessionWithBiometrics();

      if (!result.success) {
        setBiometricReason(result.reason);
        return;
      }

      unlockVeraSession(result.session);
      router.replace('/(interior)');
    } finally {
      setBiometricPending(false);
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
            Use biometria ou PIN Vera para continuar.
          </AppText>
        </View>

        <View style={styles.form}>
          {profileError ? (
            <View style={styles.message}>
              <Feather name="alert-circle" size={20} color={colors.danger} />
              <AppText variant="caption" style={styles.messageText}>
                {profileError}
              </AppText>
            </View>
          ) : null}

          <Button
            accessibilityRole="button"
            disabled={Boolean(profileError) || !biometricAvailable || biometricPending}
            loading={biometricPending}
            onPress={handleBiometricUnlock}
            style={styles.submitButton}
            variant="secondary"
          >
            Usar biometria
          </Button>

          {biometricMessage ? (
            <AppText variant="caption" tone="muted" style={styles.statusText}>
              {biometricMessage}
            </AppText>
          ) : null}

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
            loading={pinPending}
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
    marginTop: spacing[6],
  },
  statusText: {
    marginTop: -spacing[2],
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: 8,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
});

function getBiometricMessage(reason: VeraBiometricUnlockReason | null) {
  if (!reason) {
    return null;
  }

  if (reason === 'session_missing') {
    return 'Entre com o PIN uma vez neste aparelho.';
  }

  if (reason === 'session_expired') {
    return 'Sessao expirada. Use o PIN para continuar.';
  }

  if (reason === 'authentication_failed') {
    return 'Biometria cancelada ou nao reconhecida.';
  }

  if (
    reason === 'web_unavailable' ||
    reason === 'expo_go_unavailable' ||
    reason === 'secure_store_unavailable' ||
    reason === 'biometric_hardware_unavailable' ||
    reason === 'biometric_not_enrolled' ||
    reason === 'biometric_storage_unavailable'
  ) {
    return 'Biometria indisponivel neste ambiente. Use o PIN.';
  }

  return 'Nao deu para usar biometria agora. Use o PIN.';
}
