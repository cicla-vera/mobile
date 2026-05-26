import { api } from '@/services/api';
import type {
  ActivityEntry,
  CreateActivityEntryRequest,
} from '@/types/api.types';

export async function fetchActivityEntries(date?: string) {
  const response = await api.get<ActivityEntry[]>('/activity', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createActivityEntry(
  payload: CreateActivityEntryRequest,
) {
  const response = await api.post<ActivityEntry>('/activity', payload);

  return response.data;
}

export async function deleteActivityEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/activity/${id}`);

  return response.data;
}

export const activityService = {
  fetchActivityEntries,
  createActivityEntry,
  deleteActivityEntry,
};
