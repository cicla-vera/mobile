import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { AuthSessionProvider } from '@/providers/auth-session-provider';
import { LocalNotificationsProvider } from '@/providers/local-notifications-provider';
import { QueryProvider } from '@/providers/query-provider';
import { VeraActiveAlertProvider } from '@/providers/vera-active-alert-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryProvider>
        <AuthSessionProvider>
          <LocalNotificationsProvider>
            <VeraActiveAlertProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </VeraActiveAlertProvider>
          </LocalNotificationsProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
