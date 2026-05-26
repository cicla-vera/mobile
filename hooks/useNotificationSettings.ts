import { useMutation, useQuery } from '@tanstack/react-query';

import { notificationsService } from '@/services/notifications.service';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type { UpdateNotificationSettingsRequest } from '@/types/api.types';

export const notificationSettingsQueryKey = [
  'notification-settings',
] as const;

export function useNotificationSettingsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: notificationSettingsQueryKey,
    queryFn: notificationsService.getNotificationSettings,
    enabled: isAuthenticated,
  });
}

export function useUpdateNotificationSettingsMutation() {
  return useMutation({
    mutationKey: [...notificationSettingsQueryKey, 'update'],
    mutationFn: (payload: UpdateNotificationSettingsRequest) =>
      notificationsService.updateNotificationSettings(payload),
    onSuccess: async (settings) => {
      queryClient.setQueryData(notificationSettingsQueryKey, settings);
      await queryClient.invalidateQueries({
        queryKey: notificationSettingsQueryKey,
      });
    },
  });
}
