import { api } from '@/services/api';
import type { DataImportResult } from '@/types/api.types';

export type AppleHealthImportPayload = {
  xml: string;
};

export async function importFloData(payload: unknown) {
  const response = await api.post<DataImportResult>('/import/flo', payload);

  return response.data;
}

export async function importAppleHealthData(payload: AppleHealthImportPayload) {
  const response = await api.post<DataImportResult>(
    '/import/apple-health',
    payload,
  );

  return response.data;
}

export async function importHealthConnectData(payload: unknown) {
  const response = await api.post<DataImportResult>(
    '/import/health-connect',
    payload,
  );

  return response.data;
}

export const dataImportService = {
  importAppleHealthData,
  importFloData,
  importHealthConnectData,
};
