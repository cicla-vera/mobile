import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { queryClient } from '@/services/query-client';
import { medicationsService } from '@/services/medications.service';
import type { CreateMedicationEntryRequest } from '@/types/api.types';

export const medicationEntriesQueryKey = (date?: string) =>
  ['medications', date ?? 'all'] as const;

export function useMedicationEntriesQuery(date?: string) {
  return useQuery({
    queryKey: medicationEntriesQueryKey(date),
    queryFn: () => medicationsService.fetchMedicationEntries(date),
  });
}

export function useCreateMedicationEntryMutation() {
  return useMutation({
    mutationKey: ['medications', 'create'],
    mutationFn: (payload: CreateMedicationEntryRequest) =>
      medicationsService.createMedicationEntry(payload),
    onSuccess: async (_entry, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({
          queryKey: medicationEntriesQueryKey(payload.date),
        }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}

export function useDeleteMedicationEntryMutation() {
  return useMutation({
    mutationKey: ['medications', 'delete'],
    mutationFn: (id: string) => medicationsService.deleteMedicationEntry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: cyclesQueryKey }),
      ]);
    },
  });
}
