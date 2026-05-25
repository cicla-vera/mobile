import { useMutation, useQuery } from '@tanstack/react-query';

import { historyChartsQueryKey } from '@/hooks/useHistoryCharts';
import { queryClient } from '@/services/query-client';
import { temperatureService } from '@/services/temperature.service';
import type { CreateTemperatureEntryRequest } from '@/types/api.types';

export const temperatureEntriesQueryKey = (date?: string) =>
  ['temperature', date ?? 'all'] as const;

export function useTemperatureEntriesQuery(date?: string) {
  return useQuery({
    queryKey: temperatureEntriesQueryKey(date),
    queryFn: () => temperatureService.fetchTemperatureEntries(date),
  });
}

export function useCreateTemperatureEntryMutation() {
  return useMutation({
    mutationKey: ['temperature', 'create'],
    mutationFn: (payload: CreateTemperatureEntryRequest) =>
      temperatureService.createTemperatureEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['temperature'] }),
        queryClient.invalidateQueries({
          queryKey: temperatureEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: historyChartsQueryKey }),
      ]);
    },
  });
}

export function useDeleteTemperatureEntryMutation() {
  return useMutation({
    mutationKey: ['temperature', 'delete'],
    mutationFn: (id: string) => temperatureService.deleteTemperatureEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['temperature'] }),
        queryClient.invalidateQueries({ queryKey: historyChartsQueryKey }),
      ]);
    },
  });
}
