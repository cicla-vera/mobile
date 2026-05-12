import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'cicla_vera_auth_token';

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
    throw new Error('Secure token storage is not available on this device.');
  }
}

export async function getStoredAuthToken() {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(AUTH_TOKEN_KEY);
  }

  await ensureSecureStoreAvailable();

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setStoredAuthToken(token: string) {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function deleteStoredAuthToken() {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
