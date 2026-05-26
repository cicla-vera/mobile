import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACTIVE_ALERT_SESSION_ID_KEY = 'cicla_vera_active_alert_session_id';

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

export async function getStoredActiveAlertSessionId() {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(ACTIVE_ALERT_SESSION_ID_KEY);
  }

  await ensureSecureStoreAvailable();

  return SecureStore.getItemAsync(ACTIVE_ALERT_SESSION_ID_KEY);
}

export async function setStoredActiveAlertSessionId(alertSessionId: string) {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(ACTIVE_ALERT_SESSION_ID_KEY, alertSessionId);
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.setItemAsync(
    ACTIVE_ALERT_SESSION_ID_KEY,
    alertSessionId,
    {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    },
  );
}

export async function deleteStoredActiveAlertSessionId() {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(ACTIVE_ALERT_SESSION_ID_KEY);
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.deleteItemAsync(ACTIVE_ALERT_SESSION_ID_KEY);
}
