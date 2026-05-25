import { api } from '@/services/api';
import type {
  CreateMedicationEntryRequest,
  MedicationEntry,
} from '@/types/api.types';

export async function fetchMedicationEntries(date?: string) {
  const response = await api.get<MedicationEntry[]>('/medications', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createMedicationEntry(
  payload: CreateMedicationEntryRequest,
) {
  const response = await api.post<MedicationEntry>('/medications', payload);

  return response.data;
}

export async function deleteMedicationEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/medications/${id}`);

  return response.data;
}

export const medicationsService = {
  fetchMedicationEntries,
  createMedicationEntry,
  deleteMedicationEntry,
};
