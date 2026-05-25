import { api } from '@/services/api';
import type {
  CycleHistory,
  CreateCycleRequest,
  CycleLog,
  CyclePrediction,
  MonthlySummary,
  UpdateCycleRequest,
} from '@/types/api.types';

export async function findCycles() {
  const response = await api.get<CycleLog[]>('/cycles');

  return response.data;
}

export async function predictCycle() {
  const response = await api.get<CyclePrediction>('/cycles/predict');

  return response.data;
}

export async function getCycleHistory() {
  const response = await api.get<CycleHistory>('/cycles/history');

  return response.data;
}

export async function getMonthlySummary(month: string) {
  const response = await api.get<MonthlySummary>(`/cycles/summary/${month}`);

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
  predictCycle,
  getCycleHistory,
  getMonthlySummary,
  createCycle,
  updateCycle,
};
