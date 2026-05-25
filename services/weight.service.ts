import { api } from '@/services/api';
import type {
  CreateWeightEntryRequest,
  WeightEntry,
} from '@/types/api.types';

export async function fetchWeightEntries(date?: string) {
  const response = await api.get<WeightEntry[]>('/weight', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createWeightEntry(payload: CreateWeightEntryRequest) {
  const response = await api.post<WeightEntry>('/weight', payload);

  return response.data;
}

export async function deleteWeightEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/weight/${id}`);

  return response.data;
}

export const weightService = {
  fetchWeightEntries,
  createWeightEntry,
  deleteWeightEntry,
};
