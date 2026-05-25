import { api } from '@/services/api';
import type {
  AlertEvent,
  AlertSession,
  AlertTimeline,
  CloseAlertSessionRequest,
  CreateAlertEventRequest,
  StartLocationAlertSessionRequest,
  StartManualAlertSessionRequest,
} from '@/types/vera.types';

export async function startManualAlertSession(
  payload: StartManualAlertSessionRequest = {},
) {
  const response = await api.post<AlertSession>(
    '/vera/alert-sessions/manual',
    payload,
  );

  return response.data;
}

export async function startLocationAlertSession(
  payload: StartLocationAlertSessionRequest,
) {
  const response = await api.post<AlertSession>(
    '/vera/alert-sessions/location',
    payload,
  );

  return response.data;
}

export async function findActiveAlertSession() {
  const response = await api.get<AlertSession | null>(
    '/vera/alert-sessions/active',
  );

  return response.data;
}

export async function getAlertSession(id: string) {
  const response = await api.get<AlertSession>(`/vera/alert-sessions/${id}`);

  return response.data;
}

export async function closeAlertSession(
  id: string,
  payload: CloseAlertSessionRequest,
) {
  const response = await api.post<AlertSession>(
    `/vera/alert-sessions/${id}/close`,
    payload,
  );

  return response.data;
}

export async function dispatchEmergencyContacts(id: string) {
  const response = await api.post<AlertSession>(
    `/vera/alert-sessions/${id}/dispatch-contacts`,
  );

  return response.data;
}

export async function findAlertTimeline(alertSessionId: string) {
  const response = await api.get<AlertTimeline>(
    `/vera/alert-sessions/${alertSessionId}/events`,
  );

  return response.data;
}

export async function createAlertEvent(
  alertSessionId: string,
  payload: CreateAlertEventRequest,
) {
  const response = await api.post<AlertEvent>(
    `/vera/alert-sessions/${alertSessionId}/events`,
    payload,
  );

  return response.data;
}

export const veraAlertSessionsService = {
  startManualAlertSession,
  startLocationAlertSession,
  findActiveAlertSession,
  getAlertSession,
  closeAlertSession,
  dispatchEmergencyContacts,
  findAlertTimeline,
  createAlertEvent,
};
