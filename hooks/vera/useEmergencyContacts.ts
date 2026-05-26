import { useMutation, useQuery } from '@tanstack/react-query';

import { veraEmergencyContactsService } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useEmergencyContactsQuery(includeDisabled = false) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.emergencyContactsList(includeDisabled),
    queryFn: () =>
      veraEmergencyContactsService.findEmergencyContacts(includeDisabled),
    enabled: isAuthenticated,
  });
}

export function useEmergencyContactQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.emergencyContact(id),
    queryFn: () => veraEmergencyContactsService.getEmergencyContact(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateEmergencyContactMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.emergencyContacts(), 'create'],
    mutationFn: (payload: CreateEmergencyContactRequest) =>
      veraEmergencyContactsService.createEmergencyContact(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.emergencyContacts(),
      });
    },
  });
}

export function useUpdateEmergencyContactMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.emergencyContacts(), 'update'],
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateEmergencyContactRequest;
    }) => veraEmergencyContactsService.updateEmergencyContact(id, payload),
    onSuccess: async (contact) => {
      queryClient.setQueryData(
        veraQueryKeys.emergencyContact(contact.id),
        contact,
      );
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.emergencyContacts(),
      });
    },
  });
}

export function useDisableEmergencyContactMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.emergencyContacts(), 'disable'],
    mutationFn: (id: string) =>
      veraEmergencyContactsService.disableEmergencyContact(id),
    onSuccess: async (contact) => {
      queryClient.setQueryData(
        veraQueryKeys.emergencyContact(contact.id),
        contact,
      );
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.emergencyContacts(),
      });
    },
  });
}
