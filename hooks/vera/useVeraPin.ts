import { useMutation } from '@tanstack/react-query';

import { veraPinService } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useVeraStore } from '@/stores/vera.store';
import type { SetVeraPinRequest, VerifyVeraPinRequest } from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useSetVeraPinMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.profile(), 'set-pin'],
    mutationFn: (payload: SetVeraPinRequest) => veraPinService.setVeraPin(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: veraQueryKeys.profile() });
    },
  });
}

export function useVerifyVeraPinMutation() {
  const unlockVeraSession = useVeraStore((state) => state.unlockVeraSession);

  return useMutation({
    mutationKey: [...veraQueryKeys.profile(), 'verify-pin'],
    mutationFn: (payload: VerifyVeraPinRequest) =>
      veraPinService.verifyVeraPin(payload),
    onSuccess: (session) => {
      unlockVeraSession(session);
    },
  });
}
