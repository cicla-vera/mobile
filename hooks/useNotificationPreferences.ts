import { useCallback, useEffect, useState } from "react";

import {
  disableLocalNotifications,
  enableLocalNotifications,
  syncLocalNotificationsFromPrediction,
} from "@/services/local-notifications.service";
import { areLocalNotificationsEnabled } from "@/services/notification-preferences-storage";
import type { CyclePrediction, NotificationSettings } from "@/types/api.types";

export function useNotificationPreferences() {
  const [enabled, setEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let active = true;

    void areLocalNotificationsEnabled()
      .then((value) => {
        if (active) {
          setEnabled(value);
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleNotifications = useCallback(
    async (
      nextValue: boolean,
      prediction?: CyclePrediction,
      settings?: NotificationSettings,
    ) => {
      if (!nextValue) {
        await disableLocalNotifications();
        setEnabled(false);
        setPermissionDenied(false);
        return { ok: true as const };
      }

      const permission = await enableLocalNotifications();

      if (!permission.granted) {
        setPermissionDenied(true);
        setEnabled(false);
        return { ok: false as const, reason: "permission_denied" as const };
      }

      setEnabled(true);
      setPermissionDenied(false);
      await syncLocalNotificationsFromPrediction(prediction, settings);
      return { ok: true as const };
    },
    [],
  );

  return {
    enabled,
    isReady,
    permissionDenied,
    toggleNotifications,
  };
}
