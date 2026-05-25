import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { queryClient } from '@/services/query-client';
import { intercourseService } from '@/services/intercourse.service';
import type { CreateIntercourseEntryRequest } from '@/types/api.types';

export const intercourseEntriesQueryKey = (date?: string) =>
  ['intercourse', date ?? 'all'] as const;

export function useIntercourseEntriesQuery(date?: string) {
  return useQuery({
    queryKey: intercourseEntriesQueryKey(date),
    queryFn: () => intercourseService.fetchIntercourseEntries(date),
  });
}

export function useCreateIntercourseEntryMutation() {
  return useMutation({
    mutationKey: ['intercourse', 'create'],
    mutationFn: (payload: CreateIntercourseEntryRequest) =>
      intercourseService.createIntercourseEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['intercourse'] }),
        queryClient.invalidateQueries({
          queryKey: intercourseEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteIntercourseEntryMutation() {
  return useMutation({
    mutationKey: ['intercourse', 'delete'],
    mutationFn: (id: string) => intercourseService.deleteIntercourseEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['intercourse'] }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
