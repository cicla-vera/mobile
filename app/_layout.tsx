import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { LocalNotificationsProvider } from "@/providers/local-notifications-provider";
import { QueryProvider } from "@/providers/query-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthSessionProvider>
          <LocalNotificationsProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </LocalNotificationsProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
