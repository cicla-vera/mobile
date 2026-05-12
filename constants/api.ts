import { Platform } from 'react-native';

const LOCAL_BACKEND_PORT = 3001;

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_BACKEND_PORT}/api`;
  }

  return `http://localhost:${LOCAL_BACKEND_PORT}/api`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || getDefaultApiUrl();
