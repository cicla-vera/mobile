import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';

import { useCyclePredictionQuery } from '@/hooks/useCycles';
import {
  cancelManagedLocalNotifications,
  configureLocalNotifications,
  isLocalNotificationsSupported,
  syncLocalNotificationsFromPrediction,
} from '@/services/local-notifications.service';
import { useAuthStore } from '@/stores/auth.store';

type LocalNotificationsProviderProps = {
  children: ReactNode;
};

export function LocalNotificationsProvider({
  children,
}: LocalNotificationsProviderProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const predictionQuery = useCyclePredictionQuery();

  useEffect(() => {
    void configureLocalNotifications();

    if (!isLocalNotificationsSupported()) {
      return;
    }

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const screen = response.notification.request.content.data
          ?.screen as string | undefined;

        if (screen === 'home') {
          router.push('/(exterior)');
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
      return;
    }

    void syncLocalNotificationsFromPrediction(predictionQuery.data);
  }, [
    isAuthenticated,
    isHydrated,
    predictionQuery.data,
    predictionQuery.dataUpdatedAt,
  ]);

  return children;
}
