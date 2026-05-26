import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const LOCAL_NOTIFICATIONS_ENABLED_KEY = "cicla_local_notifications_enabled";

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function getWebStorage() {
  if (Platform.OS !== "web") {
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
    throw new Error("Secure storage is not available on this device.");
  }
}

export async function areLocalNotificationsEnabled() {
  const webStorage = getWebStorage();

  if (webStorage) {
    const value = webStorage.getItem(LOCAL_NOTIFICATIONS_ENABLED_KEY);
    return value === "true";
  }

  await ensureSecureStoreAvailable();
  const value = await SecureStore.getItemAsync(LOCAL_NOTIFICATIONS_ENABLED_KEY);

  return value === "true";
}

export async function setLocalNotificationsEnabled(enabled: boolean) {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(LOCAL_NOTIFICATIONS_ENABLED_KEY, String(enabled));
    return;
  }

  await ensureSecureStoreAvailable();
  await SecureStore.setItemAsync(
    LOCAL_NOTIFICATIONS_ENABLED_KEY,
    String(enabled),
    {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    },
  );
}
