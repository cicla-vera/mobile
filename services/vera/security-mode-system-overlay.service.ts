import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Linking, Platform } from 'react-native';

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

type BubbleTapEvent = { timestamp: number };
type BubbleTapListener = (event: BubbleTapEvent) => void;

type FloatingBubbleSubscription = { remove: () => void } | undefined;

type FloatingBubbleModule = {
  canDrawOverlays: () => Promise<boolean>;
  requestOverlayPermission: () => void;
  showBubble: (options: {
    iconUri?: string;
    iconResId?: number;
    bubbleColor?: number;
    initialX?: number;
    initialY?: number;
  }) => void;
  hideBubble: () => void;
  addListener?: (
    eventName: 'onBubbleTapped',
    listener: BubbleTapListener,
  ) => FloatingBubbleSubscription;
};

const BUBBLE_COLOR = 0xfffff5ec;
const BUBBLE_ICON_MODULE = require('../../assets/images/security-bubble-icon.png');
const NATIVE_MODULE_MISSING_MESSAGE =
  'A sobreposicao sobre outros apps exige rebuild do app nativo. Rode: npx expo run:android --device';

let moduleAvailability: 'unknown' | 'available' | 'missing' = 'unknown';
let floatingBubbleModule: FloatingBubbleModule | null = null;
let cachedBubbleIconUri: string | null = null;
let bubbleIconPreloadPromise: Promise<string | null> | null = null;

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

async function resolveBubbleIconUri() {
  if (cachedBubbleIconUri) {
    return cachedBubbleIconUri;
  }

  if (bubbleIconPreloadPromise) {
    return bubbleIconPreloadPromise;
  }

  bubbleIconPreloadPromise = (async () => {
    try {
      const asset = Asset.fromModule(BUBBLE_ICON_MODULE);

      if (!asset.localUri) {
        await asset.downloadAsync();
      }

      const uri = asset.localUri ?? asset.uri ?? null;

      if (uri) {
        cachedBubbleIconUri = uri;
      }

      return uri;
    } catch {
      return null;
    } finally {
      bubbleIconPreloadPromise = null;
    }
  })();

  return bubbleIconPreloadPromise;
}

export function preloadSystemOverlayIcon() {
  if (Platform.OS !== 'android') {
    return;
  }

  void resolveBubbleIconUri();
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
    const iconUri = await resolveBubbleIconUri();

    module.showBubble({
      iconUri: iconUri ?? undefined,
      bubbleColor: BUBBLE_COLOR,
      initialX: 20,
      initialY: 140,
    });

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
    module.hideBubble();
  } catch {
    // Best effort cleanup.
  }
}

export function subscribeFloatingBubbleTap(listener: BubbleTapListener) {
  const module = loadFloatingBubbleModule();

  if (!module?.addListener) {
    return () => undefined;
  }

  let subscription: FloatingBubbleSubscription;

  try {
    subscription = module.addListener('onBubbleTapped', listener);
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      subscription?.remove();
    } catch {
      // Best effort cleanup.
    }
  };
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
