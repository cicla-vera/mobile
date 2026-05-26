import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import { VERA_DEMO_USER } from '@/services/demo/vera-demo-data';
import type {
  UpdateUserProfileRequest,
  UserProfile,
} from '@/types/api.types';

export async function getCurrentUserProfile() {
  if (isVeraDemoModeEnabled) {
    return VERA_DEMO_USER;
  }

  const response = await api.get<UserProfile>('/users/me');

  return response.data;
}

export async function updateCurrentUserProfile(
  payload: UpdateUserProfileRequest,
) {
  if (isVeraDemoModeEnabled) {
    return { ...VERA_DEMO_USER, ...payload };
  }

  const response = await api.patch<UserProfile>('/users/me', payload);

  return response.data;
}

export const userProfileService = {
  getCurrentUserProfile,
  updateCurrentUserProfile,
};
