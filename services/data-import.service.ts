import { api } from '@/services/api';
import type { DataImportResult } from '@/types/api.types';

export async function importFloData(payload: unknown) {
  const response = await api.post<DataImportResult>('/import/flo', payload);

  return response.data;
}

export const dataImportService = {
  importFloData,
};
