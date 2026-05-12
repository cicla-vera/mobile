import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryProvider>
    </SafeAreaProvider>
  );
}
