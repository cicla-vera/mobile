import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider } from '@/providers/auth-session-provider';
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthSessionProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthSessionProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
