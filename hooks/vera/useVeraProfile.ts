import { useMutation, useQuery } from '@tanstack/react-query';

import { veraSafetyProfileService } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type { UpdateSafetyProfileRequest } from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useVeraProfileQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.profile(),
    queryFn: veraSafetyProfileService.getSafetyProfile,
    enabled: isAuthenticated,
  });
}

export function useCreateVeraProfileMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.profile(), 'create'],
    mutationFn: (payload?: UpdateSafetyProfileRequest) =>
      veraSafetyProfileService.createSafetyProfile(payload),
    onSuccess: async (profile) => {
      queryClient.setQueryData(veraQueryKeys.profile(), profile);
      await queryClient.invalidateQueries({ queryKey: veraQueryKeys.profile() });
    },
  });
}

export function useUpdateVeraProfileMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.profile(), 'update'],
    mutationFn: (payload: UpdateSafetyProfileRequest) =>
      veraSafetyProfileService.updateSafetyProfile(payload),
    onSuccess: async (profile) => {
      queryClient.setQueryData(veraQueryKeys.profile(), profile);
      await queryClient.invalidateQueries({ queryKey: veraQueryKeys.profile() });
    },
  });
}
