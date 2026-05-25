import { api } from '@/services/api';
import type {
  CreateSafetyLocationRequest,
  SafetyLocation,
  UpdateSafetyLocationRequest,
} from '@/types/vera.types';

export async function findSafetyLocations(includeDisabled = false) {
  const response = await api.get<SafetyLocation[]>(
    '/vera/safety-locations',
    {
      params: { includeDisabled },
    },
  );

  return response.data;
}

export async function findActiveSafetyLocations() {
  const response = await api.get<SafetyLocation[]>(
    '/vera/safety-locations/active',
  );

  return response.data;
}

export async function getSafetyLocation(id: string) {
  const response = await api.get<SafetyLocation>(
    `/vera/safety-locations/${id}`,
  );

  return response.data;
}

export async function createSafetyLocation(
  payload: CreateSafetyLocationRequest,
) {
  const response = await api.post<SafetyLocation>(
    '/vera/safety-locations',
    payload,
  );

  return response.data;
}

export async function updateSafetyLocation(
  id: string,
  payload: UpdateSafetyLocationRequest,
) {
  const response = await api.patch<SafetyLocation>(
    `/vera/safety-locations/${id}`,
    payload,
  );

  return response.data;
}

export async function disableSafetyLocation(id: string) {
  const response = await api.delete<SafetyLocation>(
    `/vera/safety-locations/${id}`,
  );

  return response.data;
}

export const veraSafetyLocationsService = {
  findSafetyLocations,
  findActiveSafetyLocations,
  getSafetyLocation,
  createSafetyLocation,
  updateSafetyLocation,
  disableSafetyLocation,
};
