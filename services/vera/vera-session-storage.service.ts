import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  isVeraSessionValid,
  type VeraSession,
} from '@/stores/vera.store';

const VERA_BIOMETRIC_SESSION_KEY = 'cicla_vera_biometric_session';
const VERA_BIOMETRIC_PROMPT = 'Desbloquear Vera';

const secureStoreOptions = {
  authenticationPrompt: VERA_BIOMETRIC_PROMPT,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,
} satisfies SecureStore.SecureStoreOptions;

export type VeraBiometricUnlockReason =
  | 'web_unavailable'
  | 'expo_go_unavailable'
  | 'secure_store_unavailable'
  | 'biometric_hardware_unavailable'
  | 'biometric_not_enrolled'
  | 'biometric_storage_unavailable'
  | 'session_missing'
  | 'session_expired'
  | 'session_invalid'
  | 'session_storage_failed'
  | 'authentication_failed';

export type VeraBiometricUnlockAvailability = {
  available: boolean;
  reason?: VeraBiometricUnlockReason;
};

export type VeraBiometricUnlockResult =
  | {
      success: true;
      session: VeraSession;
    }
  | {
      success: false;
      reason: VeraBiometricUnlockReason;
    };

export async function getVeraBiometricUnlockAvailability(): Promise<VeraBiometricUnlockAvailability> {
  if (Platform.OS === 'web') {
    return { available: false, reason: 'web_unavailable' };
  }

  if (Constants.appOwnership === 'expo') {
    return { available: false, reason: 'expo_go_unavailable' };
  }

  const [secureStoreAvailable, hasHardware, isEnrolled] = await Promise.all([
    SecureStore.isAvailableAsync(),
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  if (!secureStoreAvailable) {
    return { available: false, reason: 'secure_store_unavailable' };
  }

  if (!hasHardware) {
    return { available: false, reason: 'biometric_hardware_unavailable' };
  }

  if (!isEnrolled) {
    return { available: false, reason: 'biometric_not_enrolled' };
  }

  if (!SecureStore.canUseBiometricAuthentication()) {
    return { available: false, reason: 'biometric_storage_unavailable' };
  }

  return { available: true };
}

export async function storeVeraSessionForBiometricUnlock(
  session: VeraSession,
): Promise<VeraBiometricUnlockAvailability> {
  if (!isStoredSessionValid(session)) {
    return { available: false, reason: 'session_expired' };
  }

  const availability = await getVeraBiometricUnlockAvailability();

  if (!availability.available) {
    return availability;
  }

  try {
    await SecureStore.setItemAsync(
      VERA_BIOMETRIC_SESSION_KEY,
      JSON.stringify({
        expiresAt: session.expiresAt,
        veraSessionToken: session.veraSessionToken,
      } satisfies VeraSession),
      secureStoreOptions,
    );

    return { available: true };
  } catch {
    return { available: false, reason: 'session_storage_failed' };
  }
}

export async function unlockStoredVeraSessionWithBiometrics(): Promise<VeraBiometricUnlockResult> {
  const availability = await getVeraBiometricUnlockAvailability();

  if (!availability.available) {
    return {
      success: false,
      reason: availability.reason ?? 'biometric_storage_unavailable',
    };
  }

  let storedSession: string | null;

  try {
    storedSession = await SecureStore.getItemAsync(
      VERA_BIOMETRIC_SESSION_KEY,
      secureStoreOptions,
    );
  } catch {
    return { success: false, reason: 'authentication_failed' };
  }

  if (!storedSession) {
    return { success: false, reason: 'session_missing' };
  }

  const session = parseStoredSession(storedSession);

  if (!session) {
    await clearStoredVeraBiometricSession();
    return { success: false, reason: 'session_invalid' };
  }

  if (!isStoredSessionValid(session)) {
    await clearStoredVeraBiometricSession();
    return { success: false, reason: 'session_expired' };
  }

  return { success: true, session };
}

export async function clearStoredVeraBiometricSession() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(VERA_BIOMETRIC_SESSION_KEY);
  } catch {
    // Best effort cleanup. A stale entry will be rejected by expiration checks.
  }
}

function parseStoredSession(value: string): VeraSession | null {
  try {
    const parsed = JSON.parse(value) as Partial<VeraSession>;

    if (
      typeof parsed.expiresAt !== 'string' ||
      typeof parsed.veraSessionToken !== 'string'
    ) {
      return null;
    }

    return {
      expiresAt: parsed.expiresAt,
      veraSessionToken: parsed.veraSessionToken,
    };
  } catch {
    return null;
  }
}

function isStoredSessionValid(session: VeraSession) {
  return isVeraSessionValid({
    isUnlocked: true,
    sessionExpiresAt: session.expiresAt,
    veraSessionToken: session.veraSessionToken,
  });
}
