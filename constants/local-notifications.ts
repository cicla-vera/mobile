export const LOCAL_NOTIFICATION_IDENTIFIERS = {
  DAILY_LOG: 'cicla.notification.daily-log',
  FERTILE_WINDOW: 'cicla.notification.fertile-window',
  NEXT_PERIOD: 'cicla.notification.next-period',
} as const;

export const LOCAL_NOTIFICATION_IDENTIFIER_LIST = Object.values(
  LOCAL_NOTIFICATION_IDENTIFIERS,
);

export const DEFAULT_NOTIFICATION_HOUR = 8;
export const DEFAULT_NOTIFICATION_MINUTE = 0;

export const LOCAL_NOTIFICATION_CHANNEL_NAME = 'Lembretes do ciclo';
