import { router } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { SECURITY_MODE_TRIGGER_ACTION_ID } from "@/constants/security-mode-overlay";
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
import { triggerSimulatedViolenceDetection } from "@/services/vera/security-audio-simulation.service";
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
    let disposed = false;
    let responseSubscription: { remove: () => void } | null = null;

    void configureLocalNotifications();
    void configureSecurityModeOverlayChannel();

    if (!isLocalNotificationsSupported()) {
      return;
    }

    void addLocalNotificationResponseListener((data, actionIdentifier) => {
      const screen = data.screen as string | undefined;
      const alertSessionId = data.alertSessionId as string | undefined;
      const securityModeAction = data.securityModeAction as string | undefined;

      if (
        securityModeAction === "simulate-trigger" ||
        actionIdentifier === SECURITY_MODE_TRIGGER_ACTION_ID
      ) {
        void triggerSimulatedViolenceDetection().catch(() => undefined);
        router.push("/(exterior)");
        return;
      }

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
