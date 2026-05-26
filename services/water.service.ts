import { api } from '@/services/api';
import type {
  CreateWaterEntryRequest,
  WaterDayLog,
  WaterEntry,
} from '@/types/api.types';

export async function fetchWaterDayLog(date: string) {
  const response = await api.get<WaterDayLog>('/water', {
    params: { date },
  });

  return response.data;
}

export async function fetchWaterEntries() {
  const response = await api.get<WaterEntry[]>('/water');

  return response.data;
}

export async function createWaterEntry(payload: CreateWaterEntryRequest) {
  const response = await api.post<WaterEntry>('/water', payload);

  return response.data;
}

export async function deleteWaterEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/water/${id}`);

  return response.data;
}

export const waterService = {
  fetchWaterDayLog,
  fetchWaterEntries,
  createWaterEntry,
  deleteWaterEntry,
};
