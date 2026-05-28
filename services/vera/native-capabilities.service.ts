import Constants from 'expo-constants';
import { Camera } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Platform } from 'react-native';

import {
  getExpoNotificationsModule,
  getExpoNotificationsUnsupportedReason,
} from '@/services/expo-notifications-runtime';

type NativePermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

type PermissionLike = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

export type VeraNativePermissionSnapshot = {
  status: NativePermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  reason?: string;
};

export type VeraNativeRuntime = {
  appOwnership: string | null;
  isExpoGo: boolean;
  platform: typeof Platform.OS;
};

export type VeraBiometricCapability = {
  available: boolean;
  enrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  reason?: string;
};

export type VeraNativeCapabilityStatus = {
  runtime: VeraNativeRuntime;
  biometrics: VeraBiometricCapability;
  location: {
    servicesEnabled: boolean;
    foreground: VeraNativePermissionSnapshot;
    background: VeraNativePermissionSnapshot;
  };
  taskManager: {
    available: boolean;
    reason?: string;
  };
  camera: {
    camera: VeraNativePermissionSnapshot;
    microphone: VeraNativePermissionSnapshot;
  };
  audio: {
    recording: VeraNativePermissionSnapshot;
  };
  notifications: VeraNativePermissionSnapshot;
};

export function getVeraNativeRuntime(): VeraNativeRuntime {
  const appOwnership = Constants.appOwnership ?? null;

  return {
    appOwnership,
    isExpoGo: appOwnership === 'expo',
    platform: Platform.OS,
  };
}

export async function getVeraNativeCapabilityStatus(): Promise<VeraNativeCapabilityStatus> {
  const [
    biometrics,
    locationServicesEnabled,
    foregroundLocation,
    backgroundLocation,
    taskManager,
    camera,
    cameraMicrophone,
    audioRecording,
    notifications,
  ] = await Promise.all([
    getBiometricCapability(),
    readBooleanCapability(() => Location.hasServicesEnabledAsync()),
    readPermission(() => Location.getForegroundPermissionsAsync()),
    readPermission(() => Location.getBackgroundPermissionsAsync()),
    getTaskManagerCapability(),
    readPermission(() => Camera.getCameraPermissionsAsync()),
    readPermission(() => Camera.getMicrophonePermissionsAsync()),
    readPermission(() => getRecordingPermissionsAsync()),
    getNotificationPermission(),
  ]);

  return {
    runtime: getVeraNativeRuntime(),
    biometrics,
    location: {
      servicesEnabled: locationServicesEnabled,
      foreground: foregroundLocation,
      background: backgroundLocation,
    },
    taskManager,
    camera: {
      camera,
      microphone: cameraMicrophone,
    },
    audio: {
      recording: audioRecording,
    },
    notifications,
  };
}

export async function requestVeraForegroundLocationPermission() {
  return readPermission(() => Location.requestForegroundPermissionsAsync());
}

export async function requestVeraBackgroundLocationPermission() {
  return readPermission(() => Location.requestBackgroundPermissionsAsync());
}

export async function requestVeraCameraPermission() {
  return readPermission(() => Camera.requestCameraPermissionsAsync());
}

export async function requestVeraCameraMicrophonePermission() {
  return readPermission(() => Camera.requestMicrophonePermissionsAsync());
}

export async function requestVeraAudioRecordingPermission() {
  return readPermission(() => requestRecordingPermissionsAsync());
}

export async function requestVeraNotificationPermission() {
  const unsupportedReason = getExpoNotificationsUnsupportedReason();

  if (unsupportedReason) {
    return unavailablePermission(unsupportedReason);
  }

  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return unavailablePermission('notifications_unavailable');
  }

  return readPermission(() => Notifications.requestPermissionsAsync());
}

async function getBiometricCapability(): Promise<VeraBiometricCapability> {
  if (Platform.OS === 'web') {
    return {
      available: false,
      enrolled: false,
      supportedTypes: [],
      reason: 'web_unavailable',
    };
  }

  try {
    const [available, enrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    return {
      available,
      enrolled,
      supportedTypes,
      reason: available ? undefined : 'hardware_unavailable',
    };
  } catch {
    return {
      available: false,
      enrolled: false,
      supportedTypes: [],
      reason: 'capability_check_failed',
    };
  }
}

async function getTaskManagerCapability() {
  try {
    const available = await TaskManager.isAvailableAsync();

    return {
      available,
      reason: available ? undefined : 'task_manager_unavailable',
    };
  } catch {
    return {
      available: false,
      reason: 'capability_check_failed',
    };
  }
}

async function getNotificationPermission() {
  const unsupportedReason = getExpoNotificationsUnsupportedReason();

  if (unsupportedReason) {
    return unavailablePermission(unsupportedReason);
  }

  const Notifications = await getExpoNotificationsModule();

  if (!Notifications) {
    return unavailablePermission('notifications_unavailable');
  }

  return readPermission(() => Notifications.getPermissionsAsync());
}

async function readBooleanCapability(check: () => Promise<boolean>) {
  try {
    return await check();
  } catch {
    return false;
  }
}

async function readPermission(
  check: () => Promise<PermissionLike>,
): Promise<VeraNativePermissionSnapshot> {
  try {
    return normalizePermission(await check());
  } catch {
    return {
      status: 'unavailable',
      granted: false,
      canAskAgain: false,
      reason: 'permission_check_failed',
    };
  }
}

function unavailablePermission(reason: string): VeraNativePermissionSnapshot {
  return {
    status: 'unavailable',
    granted: false,
    canAskAgain: false,
    reason,
  };
}

function normalizePermission(
  permission: PermissionLike,
): VeraNativePermissionSnapshot {
  if (
    permission.status === 'granted' ||
    permission.status === 'denied' ||
    permission.status === 'undetermined'
  ) {
    return {
      status: permission.status,
      granted: permission.granted,
      canAskAgain: permission.canAskAgain,
    };
  }

  return {
    status: 'unavailable',
    granted: false,
    canAskAgain: false,
    reason: `unsupported_status:${permission.status}`,
  };
}
