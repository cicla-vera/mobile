import { api } from '@/services/api';
import type {
  UpdateUserProfileRequest,
  UserProfile,
} from '@/types/api.types';

export async function getCurrentUserProfile() {
  const response = await api.get<UserProfile>('/users/me');

  return response.data;
}

export async function updateCurrentUserProfile(
  payload: UpdateUserProfileRequest,
) {
  const response = await api.patch<UserProfile>('/users/me', payload);

  return response.data;
}

export const userProfileService = {
  getCurrentUserProfile,
  updateCurrentUserProfile,
};
