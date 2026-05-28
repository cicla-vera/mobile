import Constants from "expo-constants";
import { Platform } from "react-native";

export type ExpoNotificationsModule = typeof import("expo-notifications");

let notificationsModulePromise: Promise<ExpoNotificationsModule | null> | null =
  null;

export function getExpoNotificationsUnsupportedReason() {
  if (Platform.OS === "web") {
    return "web";
  }

  if (Platform.OS === "android" && Constants.appOwnership === "expo") {
    return "expo_go_android";
  }

  return null;
}

export function isExpoNotificationsRuntimeSupported() {
  return getExpoNotificationsUnsupportedReason() === null;
}

export async function getExpoNotificationsModule() {
  if (!isExpoNotificationsRuntimeSupported()) {
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications").catch(() => null);

  return notificationsModulePromise;
}
