import { api } from '@/services/api';
import type {
  CreateCycleRequest,
  CycleLog,
  UpdateCycleRequest,
} from '@/types/api.types';

export async function findCycles() {
  const response = await api.get<CycleLog[]>('/cycles');

  return response.data;
}

export async function createCycle(payload: CreateCycleRequest) {
  const response = await api.post<CycleLog>('/cycles', payload);

  return response.data;
}

export async function updateCycle(id: string, payload: UpdateCycleRequest) {
  const response = await api.patch<CycleLog>(`/cycles/${id}`, payload);

  return response.data;
}

export const cyclesService = {
  findCycles,
  createCycle,
  updateCycle,
};
