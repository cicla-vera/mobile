import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { VeraUnlockOverlay } from '@/components/vera/vera-unlock-overlay';
import { colors } from '@/constants/theme';
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
      <Screen padded={false} style={styles.loadingScreen}>
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

  function handlePinChange(value: string) {
    const nextPin = value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
    setPin(nextPin);
    setValidationError(null);
    if (biometricAvailable) {
      setBiometricReason(null);
    }
    verifyPinMutation.reset();

    if (
      nextPin.length === PIN_MAX_LENGTH &&
      !profileError &&
      !pinPending &&
      !biometricPending
    ) {
      void submitPin(nextPin);
    }
  }

  async function submitPin(nextPin = pin) {
    if (pinPending || biometricPending || profileError) {
      return;
    }

    if (nextPin.length < PIN_MIN_LENGTH) {
      setValidationError('Digite entre 4 e 8 numeros.');
      return;
    }

    setPinPending(true);

    try {
      const session = await verifyPinMutation.mutateAsync({ pin: nextPin });
      const storageResult = await storeVeraSessionForBiometricUnlock(session);

      if (!storageResult.available && storageResult.reason !== 'session_expired') {
        setBiometricReason(storageResult.reason ?? 'session_storage_failed');
      }

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
    <Screen edges={['top', 'right', 'bottom', 'left']} padded={false}>
      <VeraUnlockOverlay
        biometricAvailable={biometricAvailable}
        biometricMessage={biometricMessage}
        biometricPending={biometricPending}
        onBack={() => router.replace('/(exterior)')}
        onBiometricPress={handleBiometricUnlock}
        onPinChange={handlePinChange}
        onPinSubmit={() => void submitPin()}
        pin={pin}
        pinError={pinError}
        pinMaxLength={PIN_MAX_LENGTH}
        pinPending={pinPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
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
