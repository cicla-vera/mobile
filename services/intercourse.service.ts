import { api } from '@/services/api';
import type {
  CreateIntercourseEntryRequest,
  IntercourseEntry,
} from '@/types/api.types';

export async function fetchIntercourseEntries(date?: string) {
  const response = await api.get<IntercourseEntry[]>('/intercourse', {
    params: date ? { date } : undefined,
  });

  return response.data;
}

export async function createIntercourseEntry(
  payload: CreateIntercourseEntryRequest,
) {
  const response = await api.post<IntercourseEntry>('/intercourse', payload);

  return response.data;
}

export async function deleteIntercourseEntry(id: string) {
  const response = await api.delete<{ count: number }>(`/intercourse/${id}`);

  return response.data;
}

export const intercourseService = {
  fetchIntercourseEntries,
  createIntercourseEntry,
  deleteIntercourseEntry,
};
