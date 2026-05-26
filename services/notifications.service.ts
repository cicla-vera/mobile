import { api } from '@/services/api';
import type {
  NotificationSettings,
  UpdateNotificationSettingsRequest,
} from '@/types/api.types';

export async function getNotificationSettings() {
  const response = await api.get<NotificationSettings>(
    '/notifications/settings',
  );

  return response.data;
}

export async function updateNotificationSettings(
  payload: UpdateNotificationSettingsRequest,
) {
  const response = await api.patch<NotificationSettings>(
    '/notifications/settings',
    payload,
  );

  return response.data;
}

export const notificationsService = {
  getNotificationSettings,
  updateNotificationSettings,
};
