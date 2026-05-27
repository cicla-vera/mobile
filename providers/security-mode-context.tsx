import { createContext, useContext } from 'react';

import type { SecurityModeSnapshot } from '@/types/vera-security-audio.types';
import type { SecurityModeOverlayPermissionResult } from '@/services/vera/security-mode-overlay.service';

export type SecurityModeContextValue = {
  snapshot: SecurityModeSnapshot;
  isBusy: boolean;
  overlayNotice: string | null;
  refresh: () => Promise<SecurityModeSnapshot>;
  start: () => Promise<SecurityModeSnapshot>;
  stop: () => Promise<SecurityModeSnapshot>;
  simulateTrigger: (customText?: string) => Promise<SecurityModeSnapshot>;
  requestOverlayPermission: () => Promise<boolean>;
  openOverlaySettings: () => Promise<void>;
  syncOverlayPermission: () => Promise<SecurityModeOverlayPermissionResult>;
};

export const SecurityModeContext = createContext<SecurityModeContextValue | null>(
  null,
);

export function useSecurityModeContext() {
  const context = useContext(SecurityModeContext);

  if (!context) {
    throw new Error(
      'useSecurityMode deve ser usado dentro de VeraSecurityModeProvider.',
    );
  }

  return context;
}
