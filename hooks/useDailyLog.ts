import { useMutation, useQuery } from '@tanstack/react-query';

import { dailyLogService } from '@/services/daily-log.service';
import { queryClient } from '@/services/query-client';
import type { SaveDailyLogRequest } from '@/types/api.types';

export const dailyLogQueryKey = (date: string) => ['daily-log', date] as const;
export const availableSymptomsQueryKey = ['symptoms', 'available'] as const;

export function useDailyLogQuery(date: string) {
  return useQuery({
    queryKey: dailyLogQueryKey(date),
    queryFn: () => dailyLogService.fetchDailyLog(date),
  });
}

export function useAvailableSymptomsQuery() {
  return useQuery({
    queryKey: availableSymptomsQueryKey,
    queryFn: dailyLogService.fetchAvailableSymptoms,
  });
}

export function useSaveDailyLogMutation() {
  return useMutation({
    mutationKey: ['daily-log', 'save'],
    mutationFn: (payload: SaveDailyLogRequest) =>
      dailyLogService.saveDailyLog(payload),
    onSuccess: async (_result, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dailyLogQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({
          queryKey: availableSymptomsQueryKey,
        }),
      ]);
    },
  });
}
