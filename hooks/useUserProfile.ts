import { useMutation, useQuery } from '@tanstack/react-query';

import { userProfileService } from '@/services/user-profile.service';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type { UpdateUserProfileRequest } from '@/types/api.types';

export const userProfileQueryKey = ['user-profile'] as const;

export function useUserProfileQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: userProfileQueryKey,
    queryFn: userProfileService.getCurrentUserProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateUserProfileMutation() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationKey: [...userProfileQueryKey, 'update'],
    mutationFn: (payload: UpdateUserProfileRequest) =>
      userProfileService.updateCurrentUserProfile(payload),
    onSuccess: async (profile) => {
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
      });

      queryClient.setQueryData(userProfileQueryKey, profile);
      await queryClient.invalidateQueries({ queryKey: userProfileQueryKey });
    },
  });
}
