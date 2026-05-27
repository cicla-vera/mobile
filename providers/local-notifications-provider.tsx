import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { useCyclePredictionQuery } from "@/hooks/useCycles";
import { useNotificationSettingsQuery } from "@/hooks/useNotificationSettings";
import {
  cancelManagedLocalNotifications,
  cancelVeraActiveAlertNotification,
  configureLocalNotifications,
  isLocalNotificationsSupported,
  syncLocalNotificationsFromPrediction,
} from "@/services/local-notifications.service";
import { configureSecurityModeOverlayChannel } from "@/services/vera/security-mode-overlay.service";
import { useAuthStore } from "@/stores/auth.store";
import { getHasValidVeraSession } from "@/stores/vera.store";

type LocalNotificationsProviderProps = {
  children: ReactNode;
};

export function LocalNotificationsProvider({
  children,
}: LocalNotificationsProviderProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const predictionQuery = useCyclePredictionQuery();
  const settingsQuery = useNotificationSettingsQuery();

  useEffect(() => {
    void configureLocalNotifications();
    void configureSecurityModeOverlayChannel();

    if (!isLocalNotificationsSupported()) {
      return;
    }

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const screen = response.notification.request.content.data?.screen as
          | string
          | undefined;
        const alertSessionId = response.notification.request.content.data
          ?.alertSessionId as string | undefined;

        if (screen === "home") {
          router.push("/(exterior)");
        }

        if (screen === "vera-active-alert") {
          if (!getHasValidVeraSession()) {
            router.push("/(exterior)/vera-unlock");
            return;
          }

          if (alertSessionId) {
            router.push({
              pathname: "/(interior)/alert-timeline",
              params: { alertSessionId },
            });
            return;
          }

          router.push("/(interior)/alerts");
        }
      });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      void cancelManagedLocalNotifications();
      void cancelVeraActiveAlertNotification();
      return;
    }

    void syncLocalNotificationsFromPrediction(
      predictionQuery.data,
      settingsQuery.data,
    );
  }, [
    isAuthenticated,
    isHydrated,
    predictionQuery.data,
    predictionQuery.dataUpdatedAt,
    settingsQuery.data,
    settingsQuery.dataUpdatedAt,
  ]);

  return children;
}
