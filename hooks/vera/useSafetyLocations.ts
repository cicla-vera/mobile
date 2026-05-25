import { useMutation, useQuery } from '@tanstack/react-query';

import { veraSafetyLocationsService } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
  CreateSafetyLocationRequest,
  UpdateSafetyLocationRequest,
} from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useSafetyLocationsQuery(includeDisabled = false) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.safetyLocationsList(includeDisabled),
    queryFn: () =>
      veraSafetyLocationsService.findSafetyLocations(includeDisabled),
    enabled: isAuthenticated,
  });
}

export function useActiveSafetyLocationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.activeSafetyLocations(),
    queryFn: veraSafetyLocationsService.findActiveSafetyLocations,
    enabled: isAuthenticated,
  });
}

export function useSafetyLocationQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.safetyLocation(id),
    queryFn: () => veraSafetyLocationsService.getSafetyLocation(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateSafetyLocationMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.safetyLocations(), 'create'],
    mutationFn: (payload: CreateSafetyLocationRequest) =>
      veraSafetyLocationsService.createSafetyLocation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.safetyLocations(),
      });
    },
  });
}

export function useUpdateSafetyLocationMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.safetyLocations(), 'update'],
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSafetyLocationRequest;
    }) => veraSafetyLocationsService.updateSafetyLocation(id, payload),
    onSuccess: async (location) => {
      queryClient.setQueryData(
        veraQueryKeys.safetyLocation(location.id),
        location,
      );
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.safetyLocations(),
      });
    },
  });
}

export function useDisableSafetyLocationMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.safetyLocations(), 'disable'],
    mutationFn: (id: string) =>
      veraSafetyLocationsService.disableSafetyLocation(id),
    onSuccess: async (location) => {
      queryClient.setQueryData(
        veraQueryKeys.safetyLocation(location.id),
        location,
      );
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.safetyLocations(),
      });
    },
  });
}
