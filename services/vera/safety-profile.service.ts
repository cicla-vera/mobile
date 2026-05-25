import { api } from '@/services/api';
import type {
  SafetyProfile,
  UpdateSafetyProfileRequest,
} from '@/types/vera.types';

export async function getSafetyProfile() {
  const response = await api.get<SafetyProfile>('/vera/profile');

  return response.data;
}

export async function createSafetyProfile(
  payload: UpdateSafetyProfileRequest = {},
) {
  const response = await api.post<SafetyProfile>('/vera/profile', payload);

  return response.data;
}

export async function updateSafetyProfile(
  payload: UpdateSafetyProfileRequest,
) {
  const response = await api.patch<SafetyProfile>('/vera/profile', payload);

  return response.data;
}

export const veraSafetyProfileService = {
  getSafetyProfile,
  createSafetyProfile,
  updateSafetyProfile,
};
