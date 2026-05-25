import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DEFAULT_NOTIFICATION_HOUR,
  DEFAULT_NOTIFICATION_MINUTE,
  LOCAL_NOTIFICATION_CHANNEL_NAME,
  LOCAL_NOTIFICATION_IDENTIFIER_LIST,
  LOCAL_NOTIFICATION_IDENTIFIERS,
} from '@/constants/local-notifications';
import { VERA_NOTIFICATION_CHANNEL_ID } from '@/constants/vera-native';
import {
  areLocalNotificationsEnabled,
  setLocalNotificationsEnabled,
} from '@/services/notification-preferences-storage';
import type { CyclePrediction } from '@/types/api.types';
import {
  getFertileWindowMessage,
  getNextPeriodMessage,
} from '@/utils/prediction';

export type LocalNotificationPermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
};

export function isLocalNotificationsSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function configureLocalNotifications() {
  if (!isLocalNotificationsSupported()) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(VERA_NOTIFICATION_CHANNEL_ID, {
      name: LOCAL_NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F2617E',
    });
  }
}

export async function ensureLocalNotificationPermission(): Promise<LocalNotificationPermissionResult> {
  if (!isLocalNotificationsSupported()) {
    return { granted: false, canAskAgain: false };
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return {
      granted: true,
      canAskAgain: current.canAskAgain,
    };
  }

  if (!current.canAskAgain) {
    return {
      granted: false,
      canAskAgain: false,
    };
  }

  const requested = await Notifications.requestPermissionsAsync();

  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain,
  };
}

export async function cancelManagedLocalNotifications() {
  if (!isLocalNotificationsSupported()) {
    return;
  }

  await Promise.all(
    LOCAL_NOTIFICATION_IDENTIFIER_LIST.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

export async function disableLocalNotifications() {
  await setLocalNotificationsEnabled(false);
  await cancelManagedLocalNotifications();
}

export async function enableLocalNotifications() {
  const permission = await ensureLocalNotificationPermission();

  if (!permission.granted) {
    return permission;
  }

  await setLocalNotificationsEnabled(true);
  return permission;
}

function buildTriggerDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const triggerDate = new Date(
    year,
    month - 1,
    day,
    DEFAULT_NOTIFICATION_HOUR,
    DEFAULT_NOTIFICATION_MINUTE,
    0,
    0,
  );

  if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  return triggerDate;
}

function androidChannelTrigger() {
  return Platform.OS === 'android'
    ? { channelId: VERA_NOTIFICATION_CHANNEL_ID }
    : {};
}

// async function scheduleDailyLogNotification() {
//   await Notifications.scheduleNotificationAsync({
//     identifier: LOCAL_NOTIFICATION_IDENTIFIERS.DAILY_LOG,
//     content: {
//       title: 'Registro diário 🚀 (Teste)',
//       body: 'Como você está se sentindo hoje? Registre seu humor.',
//       data: { screen: 'home' },
//     },
//     trigger: {
//       type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // Força o tipo para intervalo
//       seconds: 5,
//       repeats: false, // Não precisa repetir no teste
//     },
//   });
// }

async function scheduleDailyLogNotification() {
  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.DAILY_LOG,
    content: {
      title: 'Registro diário',
      body: 'Como você está se sentindo hoje? Registre seu humor.',
      data: { screen: 'home' },
    },
    trigger: {
      hour: DEFAULT_NOTIFICATION_HOUR,
      minute: DEFAULT_NOTIFICATION_MINUTE,
      repeats: true,
      ...androidChannelTrigger(),
    },
  });
}

async function scheduleFertileWindowNotification(prediction: CyclePrediction) {
  const startDateKey = prediction.fertileWindow?.start;

  if (!startDateKey) {
    return;
  }

  const triggerDate = buildTriggerDate(startDateKey);

  if (!triggerDate) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.FERTILE_WINDOW,
    content: {
      title: 'Dias férteis',
      body: 'Seus dias férteis podem estar começando hoje.',
      data: { screen: 'home' },
    },
    trigger: {
      date: triggerDate,
      ...androidChannelTrigger(),
    },
  });
}

async function scheduleNextPeriodNotification(prediction: CyclePrediction) {
  const periodDateKey = prediction.nextPeriod?.date;

  if (!periodDateKey) {
    return;
  }

  const triggerDate = buildTriggerDate(periodDateKey);

  if (!triggerDate) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.NEXT_PERIOD,
    content: {
      title: 'Próxima menstruação',
      body: getNextPeriodMessage(prediction),
      data: { screen: 'home' },
    },
    trigger: {
      date: triggerDate,
      ...androidChannelTrigger(),
    },
  });
}

export async function syncLocalNotificationsFromPrediction(
  prediction?: CyclePrediction,
) {
  if (!isLocalNotificationsSupported()) {
    return { scheduled: false, reason: 'unsupported_platform' as const };
  }

  const enabled = await areLocalNotificationsEnabled();

  if (!enabled) {
    await cancelManagedLocalNotifications();
    return { scheduled: false, reason: 'disabled' as const };
  }

  const permission = await ensureLocalNotificationPermission();

  if (!permission.granted) {
    await cancelManagedLocalNotifications();
    return { scheduled: false, reason: 'permission_denied' as const };
  }

  await cancelManagedLocalNotifications();
  await scheduleDailyLogNotification();

  if (prediction?.fertileWindow) {
    await scheduleFertileWindowNotification(prediction);
  }

  if (prediction?.nextPeriod) {
    await scheduleNextPeriodNotification(prediction);
  }

  return {
    scheduled: true,
    fertileWindow: getFertileWindowMessage(prediction),
    nextPeriod: getNextPeriodMessage(prediction),
  };
}
