import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { queryClient } from '@/services/query-client';
import { sleepService } from '@/services/sleep.service';
import type { CreateSleepEntryRequest } from '@/types/api.types';

export const sleepEntriesQueryKey = (date?: string) =>
  ['sleep', date ?? 'all'] as const;

export function useSleepEntriesQuery(date?: string) {
  return useQuery({
    queryKey: sleepEntriesQueryKey(date),
    queryFn: () => sleepService.fetchSleepEntries(date),
  });
}

export function useCreateSleepEntryMutation() {
  return useMutation({
    mutationKey: ['sleep', 'create'],
    mutationFn: (payload: CreateSleepEntryRequest) =>
      sleepService.createSleepEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sleep'] }),
        queryClient.invalidateQueries({
          queryKey: sleepEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteSleepEntryMutation() {
  return useMutation({
    mutationKey: ['sleep', 'delete'],
    mutationFn: (id: string) => sleepService.deleteSleepEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sleep'] }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
