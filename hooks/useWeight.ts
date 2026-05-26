import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { historyChartsQueryKey } from '@/hooks/useHistoryCharts';
import { queryClient } from '@/services/query-client';
import { weightService } from '@/services/weight.service';
import type { CreateWeightEntryRequest } from '@/types/api.types';

export const weightEntriesQueryKey = (date?: string) =>
  ['weight', date ?? 'all'] as const;

export function useWeightEntriesQuery(date?: string) {
  return useQuery({
    queryKey: weightEntriesQueryKey(date),
    queryFn: () => weightService.fetchWeightEntries(date),
  });
}

export function useCreateWeightEntryMutation() {
  return useMutation({
    mutationKey: ['weight', 'create'],
    mutationFn: (payload: CreateWeightEntryRequest) =>
      weightService.createWeightEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weight'] }),
        queryClient.invalidateQueries({
          queryKey: weightEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: historyChartsQueryKey }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteWeightEntryMutation() {
  return useMutation({
    mutationKey: ['weight', 'delete'],
    mutationFn: (id: string) => weightService.deleteWeightEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weight'] }),
        queryClient.invalidateQueries({ queryKey: historyChartsQueryKey }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
