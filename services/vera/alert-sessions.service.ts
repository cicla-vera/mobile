import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import {
  getDemoAlertTimeline,
  getDemoDispatchResponse,
  VERA_DEMO_ALERT_SESSION,
} from '@/services/demo/vera-demo-data';
import type {
  AlertEvent,
  AlertSession,
  AlertTimeline,
  AlertLocationSample,
  CloseAlertSessionRequest,
  CreateAlertEventRequest,
  EmergencyDispatchResponse,
  RecordLocationSamplesRequest,
  RecordLocationSamplesResponse,
  StartLocationAlertSessionRequest,
  StartManualAlertSessionRequest,
} from '@/types/vera.types';

export async function startManualAlertSession(
  payload: StartManualAlertSessionRequest = {},
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_ALERT_SESSION,
      trigger: 'MANUAL' as const,
      initialLatitude: payload.initialLatitude ?? null,
      initialLongitude: payload.initialLongitude ?? null,
    };
  }

  const response = await api.post<AlertSession>(
    '/vera/alert-sessions/manual',
    payload,
  );

  return response.data;
}

export async function startLocationAlertSession(
  payload: StartLocationAlertSessionRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_ALERT_SESSION,
      safetyLocationId: payload.safetyLocationId,
      trigger: 'LOCATION' as const,
      initialLatitude: payload.currentLatitude,
      initialLongitude: payload.currentLongitude,
    };
  }

  const response = await api.post<AlertSession>(
    '/vera/alert-sessions/location',
    payload,
  );

  return response.data;
}

export async function findActiveAlertSession() {
  if (isVeraDemoModeEnabled) {
    return VERA_DEMO_ALERT_SESSION;
  }

  const response = await api.get<AlertSession | null>(
    '/vera/alert-sessions/active',
  );

  return response.data;
}

export async function getAlertSession(id: string) {
  if (isVeraDemoModeEnabled) {
    return { ...VERA_DEMO_ALERT_SESSION, id };
  }

  const response = await api.get<AlertSession>(`/vera/alert-sessions/${id}`);

  return response.data;
}

export async function closeAlertSession(
  id: string,
  payload: CloseAlertSessionRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_ALERT_SESSION,
      id,
      status: payload.status,
      endedAt: new Date().toISOString(),
    };
  }

  const response = await api.post<AlertSession>(
    `/vera/alert-sessions/${id}/close`,
    payload,
  );

  return response.data;
}

export async function dispatchEmergencyContacts(id: string) {
  if (isVeraDemoModeEnabled) {
    return { ...getDemoDispatchResponse(), alertSessionId: id };
  }

  const response = await api.post<EmergencyDispatchResponse>(
    `/vera/alert-sessions/${id}/dispatch-contacts`,
  );

  return response.data;
}

export async function findAlertTimeline(alertSessionId: string) {
  if (isVeraDemoModeEnabled) {
    return { ...getDemoAlertTimeline(), alertSessionId };
  }

  const response = await api.get<AlertTimeline>(
    `/vera/alert-sessions/${alertSessionId}/events`,
  );

  return response.data;
}

export async function createAlertEvent(
  alertSessionId: string,
  payload: CreateAlertEventRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      id: `demo-event-${Date.now()}`,
      userId: VERA_DEMO_ALERT_SESSION.userId,
      alertSessionId,
      type: payload.type,
      message: payload.message ?? 'Evento demo registrado.',
      metadata: payload.metadata ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      createdAt: new Date().toISOString(),
    } satisfies AlertEvent;
  }

  const response = await api.post<AlertEvent>(
    `/vera/alert-sessions/${alertSessionId}/events`,
    payload,
  );

  return response.data;
}

export async function recordAlertLocationSamples(
  alertSessionId: string,
  payload: RecordLocationSamplesRequest,
) {
  if (isVeraDemoModeEnabled) {
    const samples = 'samples' in payload ? payload.samples : [payload];

    return {
      alertSessionId,
      samples: samples.map((sample, index) => ({
        id: `demo-location-sample-${Date.now()}-${index}`,
        accuracyMeters: sample.accuracyMeters ?? null,
        alertSessionId,
        altitudeMeters: sample.altitudeMeters ?? null,
        capturedAt: sample.capturedAt,
        createdAt: new Date().toISOString(),
        evidenceRecordId: sample.evidenceRecordId ?? null,
        headingDegrees: sample.headingDegrees ?? null,
        latitude: sample.latitude,
        longitude: sample.longitude,
        source: sample.source ?? 'UNKNOWN',
        speedMetersPerSecond: sample.speedMetersPerSecond ?? null,
      })),
    } satisfies RecordLocationSamplesResponse;
  }

  const response = await api.post<RecordLocationSamplesResponse>(
    `/vera/alert-sessions/${alertSessionId}/location-samples`,
    payload,
  );

  return response.data;
}

export async function findAlertLocationSamples(
  alertSessionId: string,
  limit = 100,
) {
  if (isVeraDemoModeEnabled) {
    return [] satisfies AlertLocationSample[];
  }

  const response = await api.get<AlertLocationSample[]>(
    `/vera/alert-sessions/${alertSessionId}/location-samples`,
    { params: { limit } },
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
  recordAlertLocationSamples,
  findAlertLocationSamples,
};
