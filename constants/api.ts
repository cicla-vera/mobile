import { Platform } from 'react-native';

const LOCAL_BACKEND_PORT = 3001;

function normalizeApiUrl(value?: string) {
  return value?.trim() || undefined;
}

function getPlatformApiUrlFromEnv() {
  if (Platform.OS === 'android') {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL_ANDROID);
  }

  if (Platform.OS === 'ios') {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL_IOS);
  }

  if (Platform.OS === 'web') {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL_WEB);
  }

  return undefined;
}

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_BACKEND_PORT}/api`;
  }

  return `http://localhost:${LOCAL_BACKEND_PORT}/api`;
}

export const API_BASE_URL =
  getPlatformApiUrlFromEnv() ||
  normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) ||
  getDefaultApiUrl();
