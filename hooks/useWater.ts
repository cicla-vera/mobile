import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { queryClient } from '@/services/query-client';
import { waterService } from '@/services/water.service';
import type { CreateWaterEntryRequest } from '@/types/api.types';

export const waterEntriesQueryKey = ['water', 'all'] as const;
export const waterDayQueryKey = (date: string) => ['water', 'day', date] as const;

export function useWaterDayQuery(date: string) {
  return useQuery({
    queryKey: waterDayQueryKey(date),
    queryFn: () => waterService.fetchWaterDayLog(date),
  });
}

export function useWaterEntriesQuery() {
  return useQuery({
    queryKey: waterEntriesQueryKey,
    queryFn: waterService.fetchWaterEntries,
  });
}

export function useCreateWaterEntryMutation() {
  return useMutation({
    mutationKey: ['water', 'create'],
    mutationFn: (payload: CreateWaterEntryRequest) =>
      waterService.createWaterEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['water'] }),
        queryClient.invalidateQueries({
          queryKey: waterDayQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteWaterEntryMutation() {
  return useMutation({
    mutationKey: ['water', 'delete'],
    mutationFn: (id: string) => waterService.deleteWaterEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['water'] }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
