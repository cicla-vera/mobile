import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_SEEN_KEY = 'cicla_vera_onboarding_seen';

type WebStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

function getWebStorage() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    (globalThis as typeof globalThis & { localStorage?: WebStorage })
      .localStorage ?? null
  );
}

async function ensureSecureStoreAvailable() {
  const isAvailable = await SecureStore.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Secure storage is not available on this device.');
  }
}

export async function hasSeenOnboarding() {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
  }

  await ensureSecureStoreAvailable();

  return (await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY)) === 'true';
}

export async function markOnboardingSeen() {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, 'true', {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}
