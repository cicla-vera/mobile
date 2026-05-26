import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { VERA_DEMO_CONTACTS } from '@/services/demo/vera-demo-data';
import type {
  CreateEmergencyContactRequest,
  EmergencyContact,
  UpdateEmergencyContactRequest,
} from '@/types/vera.types';

export async function findEmergencyContacts(includeDisabled = false) {
  if (isVeraDemoModeEnabled) {
    return includeDisabled
      ? VERA_DEMO_CONTACTS
      : VERA_DEMO_CONTACTS.filter((contact) => contact.enabled);
  }

  const response = await api.get<EmergencyContact[]>(
    '/vera/emergency-contacts',
    {
      params: { includeDisabled },
    },
  );

  return response.data;
}

export async function getEmergencyContact(id: string) {
  if (isVeraDemoModeEnabled) {
    return (
      VERA_DEMO_CONTACTS.find((contact) => contact.id === id) ??
      VERA_DEMO_CONTACTS[0]
    );
  }

  const response = await api.get<EmergencyContact>(
    `/vera/emergency-contacts/${id}`,
  );

  return response.data;
}

export async function createEmergencyContact(
  payload: CreateEmergencyContactRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_CONTACTS[0],
      id: `demo-contact-${Date.now()}`,
      ...payload,
      enabled: true,
    };
  }

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
  if (isVeraDemoModeEnabled) {
    return {
      ...(VERA_DEMO_CONTACTS.find((contact) => contact.id === id) ??
        VERA_DEMO_CONTACTS[0]),
      ...payload,
    };
  }

  const response = await api.patch<EmergencyContact>(
    `/vera/emergency-contacts/${id}`,
    payload,
  );

  return response.data;
}

export async function disableEmergencyContact(id: string) {
  if (isVeraDemoModeEnabled) {
    return {
      ...(VERA_DEMO_CONTACTS.find((contact) => contact.id === id) ??
        VERA_DEMO_CONTACTS[0]),
      enabled: false,
    };
  }

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
