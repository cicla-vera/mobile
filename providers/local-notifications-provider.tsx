import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { useCyclePredictionQuery } from "@/hooks/useCycles";
import { useNotificationSettingsQuery } from "@/hooks/useNotificationSettings";
import {
  addLocalNotificationResponseListener,
  cancelManagedLocalNotifications,
  cancelVeraActiveAlertNotification,
  configureLocalNotifications,
  isLocalNotificationsSupported,
  syncLocalNotificationsFromPrediction,
} from "@/services/local-notifications.service";
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
    let disposed = false;
    let responseSubscription: { remove: () => void } | null = null;

    void configureLocalNotifications();

    if (!isLocalNotificationsSupported()) {
      return;
    }

    void addLocalNotificationResponseListener((data) => {
      const screen = data.screen as string | undefined;
      const alertSessionId = data.alertSessionId as string | undefined;

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
    }).then((subscription) => {
      if (disposed) {
        subscription?.remove();
        return;
      }

      responseSubscription = subscription;
    });

    return () => {
      disposed = true;
      responseSubscription?.remove();
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
