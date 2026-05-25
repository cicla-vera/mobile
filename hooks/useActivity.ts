import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { queryClient } from '@/services/query-client';
import { activityService } from '@/services/activity.service';
import type { CreateActivityEntryRequest } from '@/types/api.types';

export const activityEntriesQueryKey = (date?: string) =>
  ['activity', date ?? 'all'] as const;

export function useActivityEntriesQuery(date?: string) {
  return useQuery({
    queryKey: activityEntriesQueryKey(date),
    queryFn: () => activityService.fetchActivityEntries(date),
  });
}

export function useCreateActivityEntryMutation() {
  return useMutation({
    mutationKey: ['activity', 'create'],
    mutationFn: (payload: CreateActivityEntryRequest) =>
      activityService.createActivityEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
        queryClient.invalidateQueries({
          queryKey: activityEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteActivityEntryMutation() {
  return useMutation({
    mutationKey: ['activity', 'delete'],
    mutationFn: (id: string) => activityService.deleteActivityEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
