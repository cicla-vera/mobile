import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { VERA_DEMO_LOCATIONS } from '@/services/demo/vera-demo-data';
import type {
  CreateSafetyLocationRequest,
  SafetyLocation,
  UpdateSafetyLocationRequest,
} from '@/types/vera.types';

export async function findSafetyLocations(includeDisabled = false) {
  if (isVeraDemoModeEnabled) {
    return includeDisabled
      ? VERA_DEMO_LOCATIONS
      : VERA_DEMO_LOCATIONS.filter((location) => location.enabled);
  }

  const response = await api.get<SafetyLocation[]>(
    '/vera/safety-locations',
    {
      params: { includeDisabled },
    },
  );

  return response.data;
}

export async function findActiveSafetyLocations() {
  if (isVeraDemoModeEnabled) {
    return VERA_DEMO_LOCATIONS.filter((location) => location.enabled);
  }

  const response = await api.get<SafetyLocation[]>(
    '/vera/safety-locations/active',
  );

  return response.data;
}

export async function getSafetyLocation(id: string) {
  if (isVeraDemoModeEnabled) {
    return (
      VERA_DEMO_LOCATIONS.find((location) => location.id === id) ??
      VERA_DEMO_LOCATIONS[0]
    );
  }

  const response = await api.get<SafetyLocation>(
    `/vera/safety-locations/${id}`,
  );

  return response.data;
}

export async function createSafetyLocation(
  payload: CreateSafetyLocationRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_LOCATIONS[0],
      id: `demo-location-${Date.now()}`,
      ...payload,
      enabled: true,
      type: payload.type ?? 'RISK',
    };
  }

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
  if (isVeraDemoModeEnabled) {
    return {
      ...(VERA_DEMO_LOCATIONS.find((location) => location.id === id) ??
        VERA_DEMO_LOCATIONS[0]),
      ...payload,
    };
  }

  const response = await api.patch<SafetyLocation>(
    `/vera/safety-locations/${id}`,
    payload,
  );

  return response.data;
}

export async function disableSafetyLocation(id: string) {
  if (isVeraDemoModeEnabled) {
    return {
      ...(VERA_DEMO_LOCATIONS.find((location) => location.id === id) ??
        VERA_DEMO_LOCATIONS[0]),
      enabled: false,
    };
  }

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
