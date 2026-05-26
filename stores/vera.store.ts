import { create } from 'zustand';

import {
  deleteStoredActiveAlertSessionId,
  getStoredActiveAlertSessionId,
  setStoredActiveAlertSessionId,
} from '@/services/vera/active-alert-storage.service';
import type { VerifyVeraPinResponse } from '@/types/vera.types';

export type VeraSession = Pick<
  VerifyVeraPinResponse,
  'expiresAt' | 'veraSessionToken'
>;

type VeraState = {
  activeAlertSessionId: string | null;
  isActiveAlertHydrated: boolean;
  isUnlocked: boolean;
  sessionExpiresAt: string | null;
  veraSessionToken: string | null;
  clearActiveAlertSession: () => void;
  hydrateActiveAlertSession: () => Promise<void>;
  lockVeraSession: () => void;
  setActiveAlertSessionId: (alertSessionId: string | null) => void;
  unlockVeraSession: (session: VeraSession) => void;
};

export const useVeraStore = create<VeraState>((set) => ({
  activeAlertSessionId: null,
  isActiveAlertHydrated: false,
  isUnlocked: false,
  sessionExpiresAt: null,
  veraSessionToken: null,
  clearActiveAlertSession: () => {
    void deleteStoredActiveAlertSessionId();
    set({ activeAlertSessionId: null });
  },
  hydrateActiveAlertSession: async () => {
    try {
      const activeAlertSessionId = await getStoredActiveAlertSessionId();

      set({
        activeAlertSessionId,
        isActiveAlertHydrated: true,
      });
    } catch {
      set({
        activeAlertSessionId: null,
        isActiveAlertHydrated: true,
      });
    }
  },
  lockVeraSession: () =>
    set({
      isUnlocked: false,
      sessionExpiresAt: null,
      veraSessionToken: null,
    }),
  setActiveAlertSessionId: (activeAlertSessionId) => {
    if (activeAlertSessionId) {
      void setStoredActiveAlertSessionId(activeAlertSessionId);
    } else {
      void deleteStoredActiveAlertSessionId();
    }

    set({ activeAlertSessionId });
  },
  unlockVeraSession: (session) =>
    set({
      isUnlocked: true,
      sessionExpiresAt: session.expiresAt,
      veraSessionToken: session.veraSessionToken,
    }),
}));

export function isVeraSessionValid({
  isUnlocked,
  sessionExpiresAt,
  veraSessionToken,
}: Pick<
  VeraState,
  'isUnlocked' | 'sessionExpiresAt' | 'veraSessionToken'
>) {
  if (!isUnlocked || !sessionExpiresAt || !veraSessionToken) {
    return false;
  }

  return new Date(sessionExpiresAt).getTime() > Date.now();
}

export function getHasValidVeraSession() {
  return isVeraSessionValid(useVeraStore.getState());
}
