import { Platform } from "react-native";

import {
  DEFAULT_NOTIFICATION_HOUR,
  DEFAULT_NOTIFICATION_MINUTE,
  LOCAL_NOTIFICATION_CHANNEL_ID,
  LOCAL_NOTIFICATION_CHANNEL_NAME,
  LOCAL_NOTIFICATION_IDENTIFIER_LIST,
  LOCAL_NOTIFICATION_IDENTIFIERS,
  VERA_ACTIVE_ALERT_NOTIFICATION_IDENTIFIER,
  VERA_NOTIFICATION_CHANNEL_ID,
  VERA_NOTIFICATION_CHANNEL_NAME,
} from "@/constants/local-notifications";
import {
  areLocalNotificationsEnabled,
  setLocalNotificationsEnabled,
} from "@/services/notification-preferences-storage";
import {
  getExpoNotificationsModule,
  isExpoNotificationsRuntimeSupported,
  type ExpoNotificationsModule,
} from "@/services/expo-notifications-runtime";
import type { CyclePrediction, NotificationSettings } from "@/types/api.types";
import {
  getFertileWindowMessage,
  getNextPeriodMessage,
} from "@/utils/prediction";

export type LocalNotificationPermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
};

type VeraActiveAlertNotificationOptions = {
  alertSessionId: string | null;
  enabled: boolean;
};

type NotificationSubscription = {
  remove: () => void;
};

export function isLocalNotificationsSupported() {
  return isExpoNotificationsRuntimeSupported();
}

export async function configureLocalNotifications() {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isVeraStatus = isVeraActiveAlertNotification(
        notification.request.content.data,
      );

      return {
        shouldShowAlert: true,
        shouldPlaySound: !isVeraStatus,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS === "android") {
    await Promise.all([
      Notifications.setNotificationChannelAsync(LOCAL_NOTIFICATION_CHANNEL_ID, {
        name: LOCAL_NOTIFICATION_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F2617E",
      }),
      Notifications.setNotificationChannelAsync(VERA_NOTIFICATION_CHANNEL_ID, {
        name: VERA_NOTIFICATION_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
        showBadge: false,
        sound: null,
        enableVibrate: false,
        vibrationPattern: [0],
        lightColor: "#20257B",
      }),
    ]);
  }
}

export async function ensureLocalNotificationPermission(): Promise<LocalNotificationPermissionResult> {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
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
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Promise.all(
    LOCAL_NOTIFICATION_IDENTIFIER_LIST.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

export async function cancelVeraActiveAlertNotification() {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(
      VERA_ACTIVE_ALERT_NOTIFICATION_IDENTIFIER,
    ),
    Notifications.dismissNotificationAsync(
      VERA_ACTIVE_ALERT_NOTIFICATION_IDENTIFIER,
    ).catch(() => undefined),
  ]);
}

export async function syncVeraActiveAlertNotification({
  alertSessionId,
  enabled,
}: VeraActiveAlertNotificationOptions) {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return { scheduled: false, reason: "unsupported_platform" as const };
  }

  if (!alertSessionId || !enabled) {
    await cancelVeraActiveAlertNotification();
    return { scheduled: false, reason: "disabled" as const };
  }

  const permission = await Notifications.getPermissionsAsync();

  if (!permission.granted) {
    await cancelVeraActiveAlertNotification();
    return { scheduled: false, reason: "permission_denied" as const };
  }

  await cancelVeraActiveAlertNotification();
  await Notifications.scheduleNotificationAsync({
    identifier: VERA_ACTIVE_ALERT_NOTIFICATION_IDENTIFIER,
    content: {
      title: "Modo reservado ativo",
      body: "Toque para continuar.",
      data: {
        screen: "vera-active-alert",
        alertSessionId,
      },
      sound: false,
      badge: 0,
      sticky: false,
    },
    trigger:
      Platform.OS === "android"
        ? { channelId: VERA_NOTIFICATION_CHANNEL_ID }
        : null,
  });

  return { scheduled: true as const };
}

export async function addLocalNotificationResponseListener(
  onResponse: (data: Record<string, unknown>) => void,
): Promise<NotificationSubscription | null> {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return null;
  }

  return Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse(response.notification.request.content.data ?? {});
  });
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

function getReminderHour(settings?: NotificationSettings) {
  if (
    typeof settings?.reminderHour === "number" &&
    Number.isFinite(settings.reminderHour)
  ) {
    return settings.reminderHour;
  }

  return DEFAULT_NOTIFICATION_HOUR;
}

function buildTriggerDate(dateKey: string, settings?: NotificationSettings) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const triggerDate = new Date(
    year,
    month - 1,
    day,
    getReminderHour(settings),
    DEFAULT_NOTIFICATION_MINUTE,
    0,
    0,
  );

  if (
    Number.isNaN(triggerDate.getTime()) ||
    triggerDate.getTime() <= Date.now()
  ) {
    return null;
  }

  return triggerDate;
}

function androidChannelTrigger() {
  return Platform.OS === "android"
    ? { channelId: LOCAL_NOTIFICATION_CHANNEL_ID }
    : {};
}

function isVeraActiveAlertNotification(data?: Record<string, unknown>) {
  return data?.screen === "vera-active-alert";
}

async function scheduleDailyLogNotification(
  Notifications: ExpoNotificationsModule,
  settings?: NotificationSettings,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.DAILY_LOG,
    content: {
      title: "Registro diario",
      body: "Como voce esta se sentindo hoje? Registre seu humor.",
      data: { screen: "home" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: getReminderHour(settings),
      minute: DEFAULT_NOTIFICATION_MINUTE,
      ...androidChannelTrigger(),
    },
  });
}

async function scheduleFertileWindowNotification(
  Notifications: ExpoNotificationsModule,
  prediction: CyclePrediction,
  settings?: NotificationSettings,
) {
  if (settings?.ovulationReminder === false) {
    return;
  }

  const startDateKey = prediction.fertileWindow?.start;

  if (!startDateKey) {
    return;
  }

  const triggerDate = buildTriggerDate(startDateKey, settings);

  if (!triggerDate) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.FERTILE_WINDOW,
    content: {
      title: "Dias ferteis",
      body: "Seus dias ferteis podem estar comecando hoje.",
      data: { screen: "home" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...androidChannelTrigger(),
    },
  });
}

async function scheduleNextPeriodNotification(
  Notifications: ExpoNotificationsModule,
  prediction: CyclePrediction,
  settings?: NotificationSettings,
) {
  if (settings?.periodReminder === false) {
    return;
  }

  const periodDateKey = prediction.nextPeriod?.date;

  if (!periodDateKey) {
    return;
  }

  const triggerDate = buildTriggerDate(periodDateKey, settings);

  if (!triggerDate) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: LOCAL_NOTIFICATION_IDENTIFIERS.NEXT_PERIOD,
    content: {
      title: "Proxima menstruacao",
      body: getNextPeriodMessage(prediction),
      data: { screen: "home" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...androidChannelTrigger(),
    },
  });
}

export async function syncLocalNotificationsFromPrediction(
  prediction?: CyclePrediction,
  settings?: NotificationSettings,
) {
  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return { scheduled: false, reason: "unsupported_platform" as const };
  }

  const enabled = await areLocalNotificationsEnabled();

  if (!enabled) {
    await cancelManagedLocalNotifications();
    return { scheduled: false, reason: "disabled" as const };
  }

  const permission = await ensureLocalNotificationPermission();

  if (!permission.granted) {
    await cancelManagedLocalNotifications();
    return { scheduled: false, reason: "permission_denied" as const };
  }

  await cancelManagedLocalNotifications();
  await scheduleDailyLogNotification(Notifications, settings);

  if (prediction?.fertileWindow) {
    await scheduleFertileWindowNotification(Notifications, prediction, settings);
  }

  if (prediction?.nextPeriod) {
    await scheduleNextPeriodNotification(Notifications, prediction, settings);
  }

  return {
    scheduled: true,
    fertileWindow: getFertileWindowMessage(prediction),
    nextPeriod: getNextPeriodMessage(prediction),
  };
}
