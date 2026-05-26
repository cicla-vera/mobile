import { api } from '@/services/api';
import type { CreateSleepEntryRequest, SleepEntry } from '@/types/api.types';

export async function fetchSleepEntries(date?: string) {
  const response = await api.get<SleepEntry[]>('/sleep', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createSleepEntry(payload: CreateSleepEntryRequest) {
  const response = await api.post<SleepEntry>('/sleep', payload);

  return response.data;
}

export async function deleteSleepEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/sleep/${id}`);

  return response.data;
}

export const sleepService = {
  fetchSleepEntries,
  createSleepEntry,
  deleteSleepEntry,
};
