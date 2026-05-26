import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { VERA_DEMO_PROFILE } from '@/services/demo/vera-demo-data';
import type {
  SafetyProfile,
  UpdateSafetyProfileRequest,
} from '@/types/vera.types';

export async function getSafetyProfile() {
  if (isVeraDemoModeEnabled) {
    return VERA_DEMO_PROFILE;
  }

  const response = await api.get<SafetyProfile>('/vera/profile');

  return response.data;
}

export async function createSafetyProfile(
  payload: UpdateSafetyProfileRequest = {},
) {
  if (isVeraDemoModeEnabled) {
    return { ...VERA_DEMO_PROFILE, ...payload };
  }

  const response = await api.post<SafetyProfile>('/vera/profile', payload);

  return response.data;
}

export async function updateSafetyProfile(
  payload: UpdateSafetyProfileRequest,
) {
  if (isVeraDemoModeEnabled) {
    return { ...VERA_DEMO_PROFILE, ...payload };
  }

  const response = await api.patch<SafetyProfile>('/vera/profile', payload);

  return response.data;
}

export const veraSafetyProfileService = {
  getSafetyProfile,
  createSafetyProfile,
  updateSafetyProfile,
};
