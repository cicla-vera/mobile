import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Linking, Platform } from 'react-native';

import { SECURITY_MODE_DISCREET_COPY } from '@/constants/security-mode-overlay';

export type SystemOverlayShowResult =
  | { shown: true }
  | {
      shown: false;
      reason:
        | 'unsupported_platform'
        | 'native_module_missing'
        | 'permission_denied'
        | 'overlay_failed';
      message?: string;
    };

type FloatingBubbleModule = {
  canDrawOverlays: () => Promise<boolean>;
  requestOverlayPermission: () => void;
  showBubble: (options: {
    bubbleColor?: number;
    initialX?: number;
    initialY?: number;
  }) => void;
  hideBubble: () => void;
  showOverlay: (options: Record<string, unknown>) => void;
  hideOverlay: () => void;
};

const BUBBLE_COLOR = 0xff20257b;
const PANEL_BACKGROUND = '#FFF7F2';
const PANEL_TEXT = '#141011';
const PANEL_MUTED = '#6B6563';
const NATIVE_MODULE_MISSING_MESSAGE =
  'A sobreposicao sobre outros apps exige rebuild do app nativo. Rode: npx expo run:android --device';

let moduleAvailability: 'unknown' | 'available' | 'missing' = 'unknown';
let floatingBubbleModule: FloatingBubbleModule | null = null;

function loadFloatingBubbleModule() {
  if (moduleAvailability === 'missing') {
    return null;
  }

  if (floatingBubbleModule) {
    return floatingBubbleModule;
  }

  if (Platform.OS !== 'android') {
    moduleAvailability = 'missing';
    return null;
  }

  const native =
    requireOptionalNativeModule<FloatingBubbleModule>('ExpoFloatingBubble') ??
    loadFloatingBubbleModuleFromPackage();

  if (!native) {
    moduleAvailability = 'missing';
    floatingBubbleModule = null;
    return null;
  }

  floatingBubbleModule = native;
  moduleAvailability = 'available';
  return floatingBubbleModule;
}

function loadFloatingBubbleModuleFromPackage() {
  try {
    const moduleExport = require('expo-floating-bubble').default as
      | FloatingBubbleModule
      | undefined;

    return moduleExport ?? null;
  } catch {
    return null;
  }
}

function getAndroidPackageName() {
  return (
    Constants.expoConfig?.android?.package ??
    Constants.manifest2?.extra?.expoClient?.android?.package ??
    'com.m4rksan.ciclavera'
  );
}

export async function openAndroidOverlayPermissionSettings() {
  if (Platform.OS !== 'android') {
    return false;
  }

  const packageName = getAndroidPackageName();
  const intentUrl =
    `intent:#Intent;action=android.settings.action.MANAGE_OVERLAY_PERMISSION;` +
    `scheme=package;package=${packageName};end`;

  try {
    if (await Linking.canOpenURL(intentUrl)) {
      await Linking.openURL(intentUrl);
      return true;
    }
  } catch {
    // Fall through to app settings.
  }

  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

export function isNativeFloatingBubbleAvailable() {
  if (Platform.OS !== 'android') {
    return false;
  }

  return loadFloatingBubbleModule() !== null;
}

export function isSystemOverlaySupported() {
  return isNativeFloatingBubbleAvailable();
}

export function getNativeOverlayRebuildMessage() {
  return NATIVE_MODULE_MISSING_MESSAGE;
}

export async function canShowSystemOverlay() {
  const module = loadFloatingBubbleModule();

  if (!module) {
    return false;
  }

  try {
    return await module.canDrawOverlays();
  } catch {
    return false;
  }
}

export function openSystemOverlayPermissionSettings() {
  const module = loadFloatingBubbleModule();

  if (module) {
    try {
      module.requestOverlayPermission();
      return;
    } catch {
      // Fall through to intent-based settings screen.
    }
  }

  void openAndroidOverlayPermissionSettings();
}

export async function getSystemOverlayPermission() {
  if (Platform.OS !== 'android') {
    return { granted: false, canAskAgain: false, nativeModuleMissing: false };
  }

  if (!isNativeFloatingBubbleAvailable()) {
    return { granted: false, canAskAgain: false, nativeModuleMissing: true };
  }

  const granted = await canShowSystemOverlay();

  return {
    granted,
    canAskAgain: true,
    nativeModuleMissing: false,
  };
}

function buildDiscreetOverlayConfig() {
  return {
    componentConfig: {
      type: 'container' as const,
      style: {
        backgroundColor: PANEL_BACKGROUND,
        padding: 18,
        borderRadius: 18,
      },
      children: [
        {
          type: 'text' as const,
          text: SECURITY_MODE_DISCREET_COPY.title,
          style: {
            color: PANEL_TEXT,
            fontSize: 15,
            fontWeight: 'bold' as const,
            textAlign: 'center' as const,
          },
        },
        {
          type: 'spacer' as const,
          height: 8,
        },
        {
          type: 'text' as const,
          text: SECURITY_MODE_DISCREET_COPY.body,
          style: {
            color: PANEL_MUTED,
            fontSize: 13,
            textAlign: 'center' as const,
          },
        },
        {
          type: 'spacer' as const,
          height: 6,
        },
        {
          type: 'text' as const,
          text: SECURITY_MODE_DISCREET_COPY.detail,
          style: {
            color: PANEL_MUTED,
            fontSize: 11,
            textAlign: 'center' as const,
          },
        },
      ],
    },
  };
}

export async function showSystemSecurityOverlay(): Promise<SystemOverlayShowResult> {
  if (Platform.OS !== 'android') {
    return { shown: false, reason: 'unsupported_platform' };
  }

  const module = loadFloatingBubbleModule();

  if (!module) {
    return {
      shown: false,
      reason: 'native_module_missing',
      message: NATIVE_MODULE_MISSING_MESSAGE,
    };
  }

  const granted = await canShowSystemOverlay();

  if (!granted) {
    return {
      shown: false,
      reason: 'permission_denied',
      message:
        'Ative "Exibir sobre outros apps" para o Cicla Vera nas configuracoes do Android.',
    };
  }

  try {
    module.showBubble({
      bubbleColor: BUBBLE_COLOR,
      initialX: 20,
      initialY: 140,
    });
    module.showOverlay(buildDiscreetOverlayConfig());

    return { shown: true };
  } catch (error) {
    return {
      shown: false,
      reason: 'overlay_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Nao deu para abrir a sobreposicao do Modo Seguranca.',
    };
  }
}

export async function hideSystemSecurityOverlay() {
  const module = loadFloatingBubbleModule();

  if (!module) {
    return;
  }

  try {
    module.hideOverlay();
    module.hideBubble();
  } catch {
    // Best effort cleanup.
  }
}

export function getSystemOverlayPermissionMessage(permission: {
  granted: boolean;
  canAskAgain: boolean;
  nativeModuleMissing?: boolean;
}) {
  if (permission.nativeModuleMissing) {
    return NATIVE_MODULE_MISSING_MESSAGE;
  }

  if (permission.granted) {
    return null;
  }

  return 'Ative "Exibir sobre outros apps" para o Cicla Vera. Esse aviso disfarçado aparece sobre o WhatsApp, Chrome e demais apps.';
}
