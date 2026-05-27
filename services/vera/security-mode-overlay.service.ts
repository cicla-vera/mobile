import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

import {
  SECURITY_MODE_DISCREET_COPY,
  SECURITY_MODE_OVERLAY_CHANNEL_ID,
  SECURITY_MODE_OVERLAY_CHANNEL_NAME,
  SECURITY_MODE_OVERLAY_NOTIFICATION_ID,
} from '@/constants/security-mode-overlay';
import { requestVeraNotificationPermission } from '@/services/vera/native-capabilities.service';
import {
  getNativeOverlayRebuildMessage,
  getSystemOverlayPermission,
  getSystemOverlayPermissionMessage,
  hideSystemSecurityOverlay,
  isNativeFloatingBubbleAvailable,
  isSystemOverlaySupported,
  openSystemOverlayPermissionSettings,
  showSystemSecurityOverlay,
} from '@/services/vera/security-mode-system-overlay.service';

export type SecurityModeOverlayPermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
  usesSystemOverlay: boolean;
  nativeModuleMissing?: boolean;
};

export type SecurityModeOverlayShowResult =
  | { shown: true; surface: 'system_overlay' | 'notification' }
  | {
      shown: false;
      reason:
        | 'unsupported_platform'
        | 'permission_denied'
        | 'native_module_missing'
        | 'overlay_failed'
        | 'notification_failed';
      message?: string;
    };

let overlayChannelConfigured = false;

export async function configureSecurityModeOverlayChannel() {
  if (Platform.OS !== 'android' || overlayChannelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    SECURITY_MODE_OVERLAY_CHANNEL_ID,
    {
      name: SECURITY_MODE_OVERLAY_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: false,
      sound: null,
      enableVibrate: false,
      vibrationPattern: [0],
      lightColor: '#20257B',
    },
  );

  overlayChannelConfigured = true;
}

export async function getSecurityModeOverlayPermission(): Promise<SecurityModeOverlayPermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: false, canAskAgain: false, usesSystemOverlay: false };
  }

  if (Platform.OS === 'android') {
    const nativeModuleMissing = !isNativeFloatingBubbleAvailable();

    if (nativeModuleMissing) {
      return {
        granted: false,
        canAskAgain: true,
        usesSystemOverlay: true,
        nativeModuleMissing: true,
      };
    }

    const systemPermission = await getSystemOverlayPermission();

    return {
      ...systemPermission,
      usesSystemOverlay: true,
    };
  }

  const permission = await Notifications.getPermissionsAsync();

  return {
    granted: permission.granted,
    canAskAgain: permission.canAskAgain,
    usesSystemOverlay: false,
  };
}

export async function ensureSecurityModeOverlayPermission(): Promise<SecurityModeOverlayPermissionResult> {
  const current = await getSecurityModeOverlayPermission();

  if (current.granted) {
    return current;
  }

  if (current.usesSystemOverlay || current.nativeModuleMissing) {
    openSystemOverlayPermissionSettings();
    return getSecurityModeOverlayPermission();
  }

  if (!current.canAskAgain) {
    return current;
  }

  await configureSecurityModeOverlayChannel();
  const requested = await requestVeraNotificationPermission();

  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain,
    usesSystemOverlay: false,
  };
}

export function promptSystemOverlayPermission(
  permission: SecurityModeOverlayPermissionResult,
) {
  if (Platform.OS !== 'android' || !permission.usesSystemOverlay) {
    return Promise.resolve(permission);
  }

  if (permission.granted) {
    return Promise.resolve(permission);
  }

  return new Promise<SecurityModeOverlayPermissionResult>((resolve) => {
    Alert.alert(
      permission.nativeModuleMissing
        ? 'Rebuild necessario + permissao de sobreposicao'
        : 'Permissao para bolha disfarçada',
      permission.nativeModuleMissing
        ? 'A bolha sobre outros apps exige rebuild nativo (expo run:android). Depois, ative "Exibir sobre outros apps" para o Cicla Vera. Enquanto isso, usamos notificacao ao minimizar.'
        : 'Ao minimizar o app, o Modo Seguranca mostra uma bolha sobre WhatsApp, Chrome e demais apps. Toque em continuar para abrir a tela "Exibir sobre outros apps".',
      [
        {
          text: 'Agora nao',
          style: 'cancel',
          onPress: () => {
            resolve(permission);
          },
        },
        {
          text: permission.nativeModuleMissing
            ? 'Abrir ajustes'
            : 'Continuar',
          onPress: () => {
            openSystemOverlayPermissionSettings();
            resolve(permission);
          },
        },
      ],
    );
  });
}

export async function requestSecurityModeOverlayPermission() {
  const current = await getSecurityModeOverlayPermission();

  if (current.usesSystemOverlay) {
    openSystemOverlayPermissionSettings();
    return getSecurityModeOverlayPermission();
  }

  if (current.granted) {
    return current;
  }

  await configureSecurityModeOverlayChannel();
  const requested = await requestVeraNotificationPermission();

  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain,
    usesSystemOverlay: false,
  };
}

export async function openSecurityModeOverlaySettings() {
  const current = await getSecurityModeOverlayPermission();

  if (current.usesSystemOverlay) {
    openSystemOverlayPermissionSettings();
    return;
  }

  await Linking.openSettings();
}

export async function showSecurityModeDiscreetOverlay(): Promise<SecurityModeOverlayShowResult> {
  if (Platform.OS === 'web') {
    return { shown: false, reason: 'unsupported_platform' };
  }

  if (isSystemOverlaySupported()) {
    await hideSecurityModeDiscreetOverlay();
    const systemResult = await showSystemSecurityOverlay();

    if (systemResult.shown) {
      return { shown: true, surface: 'system_overlay' };
    }

    if (systemResult.reason === 'permission_denied') {
      return {
        shown: false,
        reason: 'permission_denied',
        message:
          systemResult.message ??
          'Ative "Exibir sobre outros apps" para o Cicla Vera e minimize o app novamente.',
      };
    }

    if (systemResult.reason === 'native_module_missing') {
      return showNotificationDiscreetOverlay();
    }

    return systemResult;
  }

  return showNotificationDiscreetOverlay();
}

async function showNotificationDiscreetOverlay(): Promise<SecurityModeOverlayShowResult> {
  try {
    await configureSecurityModeOverlayChannel();

    const permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      return {
        shown: false,
        reason: 'permission_denied',
        message:
          'Permita notificacoes para exibir o aviso discreto ao minimizar o app.',
      };
    }

    await hideNotificationDiscreetOverlay();

    await Notifications.scheduleNotificationAsync({
      identifier: SECURITY_MODE_OVERLAY_NOTIFICATION_ID,
      content: {
        title: SECURITY_MODE_DISCREET_COPY.title,
        body: SECURITY_MODE_DISCREET_COPY.body,
        subtitle:
          Platform.OS === 'android'
            ? SECURITY_MODE_DISCREET_COPY.detail
            : undefined,
        data: {
          screen: 'home',
          securityModeActive: true,
        },
        sound: false,
        badge: 0,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger:
        Platform.OS === 'android'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: 1,
              channelId: SECURITY_MODE_OVERLAY_CHANNEL_ID,
            }
          : null,
    });

    return { shown: true, surface: 'notification' };
  } catch (error) {
    return {
      shown: false,
      reason: 'notification_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Nao deu para exibir o aviso discreto agora.',
    };
  }
}

export async function hideSecurityModeDiscreetOverlay() {
  if (Platform.OS === 'web') {
    return;
  }

  await Promise.all([
    hideSystemSecurityOverlay(),
    hideNotificationDiscreetOverlay(),
  ]);
}

async function hideNotificationDiscreetOverlay() {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(
      SECURITY_MODE_OVERLAY_NOTIFICATION_ID,
    ).catch(() => undefined),
    Notifications.dismissNotificationAsync(
      SECURITY_MODE_OVERLAY_NOTIFICATION_ID,
    ).catch(() => undefined),
  ]);
}

export function getSecurityModeOverlayPermissionMessage(
  permission: SecurityModeOverlayPermissionResult,
) {
  if (permission.nativeModuleMissing) {
    return `${getNativeOverlayRebuildMessage()} Enquanto isso, usamos notificacao ao minimizar.`;
  }

  if (permission.granted) {
    return null;
  }

  if (permission.usesSystemOverlay) {
    return getSystemOverlayPermissionMessage(permission);
  }

  if (!permission.canAskAgain) {
    return 'Ative notificacoes do Cicla Vera nos ajustes do sistema para o aviso discreto ao minimizar.';
  }

  return 'Permita notificacoes para exibir o aviso disfarçado quando o app for minimizado.';
}

export function getSecurityModeOverlayActionLabel(
  permission: SecurityModeOverlayPermissionResult,
) {
  if (permission.usesSystemOverlay) {
    return 'Permitir sobreposicao';
  }

  return 'Permitir notificacoes';
}
