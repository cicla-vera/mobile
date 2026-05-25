import { api } from '@/services/api';
import type {
  CreateEmergencyContactRequest,
  EmergencyContact,
  UpdateEmergencyContactRequest,
} from '@/types/vera.types';

export async function findEmergencyContacts(includeDisabled = false) {
  const response = await api.get<EmergencyContact[]>(
    '/vera/emergency-contacts',
    {
      params: { includeDisabled },
    },
  );

  return response.data;
}

export async function getEmergencyContact(id: string) {
  const response = await api.get<EmergencyContact>(
    `/vera/emergency-contacts/${id}`,
  );

  return response.data;
}

export async function createEmergencyContact(
  payload: CreateEmergencyContactRequest,
) {
  const response = await api.post<EmergencyContact>(
    '/vera/emergency-contacts',
    payload,
  );

  return response.data;
}

export async function updateEmergencyContact(
  id: string,
  payload: UpdateEmergencyContactRequest,
) {
  const response = await api.patch<EmergencyContact>(
    `/vera/emergency-contacts/${id}`,
    payload,
  );

  return response.data;
}

export async function disableEmergencyContact(id: string) {
  const response = await api.delete<EmergencyContact>(
    `/vera/emergency-contacts/${id}`,
  );

  return response.data;
}

export const veraEmergencyContactsService = {
  findEmergencyContacts,
  getEmergencyContact,
  createEmergencyContact,
  updateEmergencyContact,
  disableEmergencyContact,
};
