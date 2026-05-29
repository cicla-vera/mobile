import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import { VERA_LOCATION_TASK_NAME } from '@/constants/vera-native';
import { getStoredAuthToken } from '@/services/token-storage';
import type { RecordLocationSampleRequest } from '@/types/vera.types';
import type {
  AlertSession,
  RecordLocationSamplesResponse,
  SafetyLocation,
  SafetyProfile,
} from '@/types/vera.types';

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

export type VeraLocationSample = {
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: number;
};

export type VeraLocationSampleSource = 'background' | 'foreground';

export type VeraStoredLocationSample = VeraLocationSample & {
  source: VeraLocationSampleSource;
};

export type VeraLocationMatch = {
  distanceMeters: number;
  location: SafetyLocation;
  sample: VeraLocationSample;
};

export type VeraLocationMonitorEvent = {
  match: VeraLocationMatch | null;
  sample: VeraLocationSample;
  source: 'background' | 'foreground';
};

export type VeraLocationMonitorStatus =
  | 'disabled'
  | 'foreground'
  | 'background'
  | 'missing_permission'
  | 'no_locations'
  | 'unavailable';

type VeraLocationTaskHandler = (sample: VeraLocationSample) => void;

const backgroundLocationHandlers = new Set<VeraLocationTaskHandler>();
const backgroundLocationAttemptAt = new Map<string, number>();
const BACKGROUND_LOCATION_ALERT_COOLDOWN_MS = 60 * 1000;
const LATEST_LOCATION_SAMPLE_MAX_AGE_MS = 2 * 60 * 1000;
let latestVeraLocationSample: VeraStoredLocationSample | null = null;

defineVeraLocationTask();

export function subscribeVeraBackgroundLocationUpdates(
  handler: VeraLocationTaskHandler,
) {
  backgroundLocationHandlers.add(handler);

  return () => {
    backgroundLocationHandlers.delete(handler);
  };
}

export function getVeraLocationMatch(
  sample: VeraLocationSample,
  locations: SafetyLocation[],
): VeraLocationMatch | null {
  const matches = locations
    .filter((location) => location.enabled && location.type === 'RISK')
    .map((location) => ({
      distanceMeters: calculateDistanceMeters(sample, location),
      location,
      sample,
    }))
    .filter((match) => match.distanceMeters <= match.location.radiusMeters)
    .sort((first, second) => first.distanceMeters - second.distanceMeters);

  return matches[0] ?? null;
}

export function rememberVeraLocationSample(
  sample: VeraLocationSample,
  source: VeraLocationSampleSource,
) {
  latestVeraLocationSample = {
    ...sample,
    source,
  };

  return latestVeraLocationSample;
}

export function getLatestVeraLocationSample(
  maxAgeMs = LATEST_LOCATION_SAMPLE_MAX_AGE_MS,
) {
  if (
    !latestVeraLocationSample ||
    Date.now() - latestVeraLocationSample.timestamp > maxAgeMs
  ) {
    return null;
  }

  return latestVeraLocationSample;
}

export function buildRecordLocationSampleRequest(
  sample: VeraLocationSample,
  source: VeraLocationSampleSource,
  evidenceRecordId?: string,
): RecordLocationSampleRequest {
  return {
    accuracyMeters: sample.accuracy ?? undefined,
    altitudeMeters: sample.altitude ?? undefined,
    capturedAt: new Date(sample.timestamp).toISOString(),
    evidenceRecordId,
    headingDegrees: sample.heading ?? undefined,
    latitude: sample.latitude,
    longitude: sample.longitude,
    source: source === 'background' ? 'BACKGROUND' : 'FOREGROUND',
    speedMetersPerSecond: sample.speed ?? undefined,
  };
}

export async function watchVeraForegroundLocation(
  onLocation: (sample: VeraLocationSample) => void,
) {
  if (Platform.OS === 'web') {
    return null;
  }

  const permission = await Location.getForegroundPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 20,
      timeInterval: 15000,
    },
    (location) => onLocation(toLocationSample(location)),
  );
}

export async function startVeraBackgroundLocationUpdates() {
  if (Platform.OS === 'web') {
    return false;
  }

  const [taskManagerAvailable, foregroundPermission, backgroundPermission] =
    await Promise.all([
      TaskManager.isAvailableAsync(),
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
    ]);

  if (
    !taskManagerAvailable ||
    !foregroundPermission.granted ||
    !backgroundPermission.granted
  ) {
    return false;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    VERA_LOCATION_TASK_NAME,
  );

  if (isRegistered) {
    return true;
  }

  await Location.startLocationUpdatesAsync(VERA_LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    activityType: Location.ActivityType.Other,
    deferredUpdatesInterval: 60000,
    distanceInterval: 25,
    foregroundService: {
      notificationBody: 'Sincronizando lembretes do calendário.',
      notificationTitle: 'Cicla Vera',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
    timeInterval: 30000,
  });

  return true;
}

export async function stopVeraBackgroundLocationUpdates() {
  if (Platform.OS === 'web') {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    VERA_LOCATION_TASK_NAME,
  );

  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(VERA_LOCATION_TASK_NAME);
  }
}

export function getVeraLocationMonitoringLimitation(
  status: VeraLocationMonitorStatus,
) {
  if (status === 'missing_permission') {
    return 'Ative permissão de localização em primeiro e segundo plano.';
  }

  if (status === 'no_locations') {
    return 'Cadastre pelo menos um local de risco ativo.';
  }

  if (status === 'unavailable') {
    return 'Background location exige um dev build em alguns ambientes Expo.';
  }

  return null;
}

function defineVeraLocationTask() {
  if (
    Platform.OS === 'web' ||
    TaskManager.isTaskDefined(VERA_LOCATION_TASK_NAME)
  ) {
    return;
  }

  TaskManager.defineTask<LocationTaskData>(
    VERA_LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error || !data?.locations?.length) {
        return;
      }

      for (const location of data.locations) {
        const sample = toLocationSample(location);
        rememberVeraLocationSample(sample, 'background');

        backgroundLocationHandlers.forEach((handler) => {
          handler(sample);
        });

        if (backgroundLocationHandlers.size === 0) {
          await maybeStartBackgroundLocationAlert(sample);
        }
      }
    },
  );
}

async function maybeStartBackgroundLocationAlert(sample: VeraLocationSample) {
  try {
    const token = await getStoredAuthToken();

    if (!token) {
      return;
    }

    const profile = await requestVeraBackground<SafetyProfile>(
      '/vera/profile',
      { token },
    );

    if (
      profile.consentAccepted !== true ||
      profile.veraEnabled !== true ||
      profile.monitoringEnabled !== true
    ) {
      return;
    }

    const activeAlert = await requestVeraBackground<AlertSession | null>(
      '/vera/alert-sessions/active',
      { token },
    );

    if (activeAlert?.id) {
      await requestVeraBackground<RecordLocationSamplesResponse>(
        `/vera/alert-sessions/${activeAlert.id}/location-samples`,
        {
          body: buildRecordLocationSampleRequest(sample, 'background'),
          method: 'POST',
          token,
        },
      );
      return;
    }

    const activeLocations = await requestVeraBackground<SafetyLocation[]>(
      '/vera/safety-locations/active',
      { token },
    );
    const match = getVeraLocationMatch(sample, activeLocations);

    if (!match) {
      return;
    }

    const lastAttemptAt =
      backgroundLocationAttemptAt.get(match.location.id) ?? 0;

    if (Date.now() - lastAttemptAt < BACKGROUND_LOCATION_ALERT_COOLDOWN_MS) {
      return;
    }

    backgroundLocationAttemptAt.set(match.location.id, Date.now());
    await requestVeraBackground<AlertSession>('/vera/alert-sessions/location', {
      body: {
        currentLatitude: sample.latitude,
        currentLongitude: sample.longitude,
        message: `Entrada detectada em segundo plano: ${match.location.name}`,
        safetyLocationId: match.location.id,
      },
      method: 'POST',
      token,
    });
  } catch {
    // Background tasks must not surface errors to the app runtime.
  }
}

async function requestVeraBackground<T>(
  path: string,
  options: { body?: unknown; method?: string; token: string },
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    method: options.method ?? 'GET',
  });

  if (!response.ok) {
    throw new Error(`Background Vera request failed with ${response.status}`);
  }

  return (await response.json().catch(() => null)) as T;
}

function toLocationSample(
  location: Location.LocationObject,
): VeraLocationSample {
  return {
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    heading: location.coords.heading,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed: location.coords.speed,
    timestamp: location.timestamp,
  };
}

function calculateDistanceMeters(
  first: Pick<VeraLocationSample, 'latitude' | 'longitude'>,
  second: Pick<SafetyLocation, 'latitude' | 'longitude'>,
) {
  const earthRadiusMeters = 6371000;
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(earthRadiusMeters * angularDistance);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
