import { useMutation, useQuery } from '@tanstack/react-query';

import { cyclesService } from '@/services/cycles.service';
import { queryClient } from '@/services/query-client';
import type { CreateCycleRequest, UpdateCycleRequest } from '@/types/api.types';

export const cyclesQueryKey = ['cycles'] as const;
export const cyclePredictionQueryKey = [
  ...cyclesQueryKey,
  'prediction',
] as const;

export function useCyclesQuery() {
  return useQuery({
    queryKey: cyclesQueryKey,
    queryFn: cyclesService.findCycles,
  });
}

export function useCyclePredictionQuery() {
  return useQuery({
    queryKey: cyclePredictionQueryKey,
    queryFn: cyclesService.predictCycle,
  });
}

export function useCreateCycleMutation() {
  return useMutation({
    mutationKey: [...cyclesQueryKey, 'create'],
    mutationFn: (payload: CreateCycleRequest) =>
      cyclesService.createCycle(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cyclesQueryKey });
    },
  });
}

export function useUpdateCycleMutation() {
  return useMutation({
    mutationKey: [...cyclesQueryKey, 'update'],
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCycleRequest;
    }) => cyclesService.updateCycle(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cyclesQueryKey });
    },
  });
}
