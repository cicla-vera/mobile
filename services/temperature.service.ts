import { api } from '@/services/api';
import type {
  CreateTemperatureEntryRequest,
  TemperatureEntry,
} from '@/types/api.types';

export async function fetchTemperatureEntries(date?: string) {
  const response = await api.get<TemperatureEntry[]>('/temperature', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createTemperatureEntry(
  payload: CreateTemperatureEntryRequest,
) {
  const response = await api.post<TemperatureEntry>('/temperature', payload);

  return response.data;
}

export async function deleteTemperatureEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/temperature/${id}`);

  return response.data;
}

export const temperatureService = {
  fetchTemperatureEntries,
  createTemperatureEntry,
  deleteTemperatureEntry,
};
