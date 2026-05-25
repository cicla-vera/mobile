import { create } from 'zustand';

import type { VerifyVeraPinResponse } from '@/types/vera.types';

export type VeraSession = Pick<
  VerifyVeraPinResponse,
  'expiresAt' | 'veraSessionToken'
>;

type VeraState = {
  activeAlertSessionId: string | null;
  isUnlocked: boolean;
  sessionExpiresAt: string | null;
  veraSessionToken: string | null;
  clearActiveAlertSession: () => void;
  lockVeraSession: () => void;
  setActiveAlertSessionId: (alertSessionId: string | null) => void;
  unlockVeraSession: (session: VeraSession) => void;
};

export const useVeraStore = create<VeraState>((set) => ({
  activeAlertSessionId: null,
  isUnlocked: false,
  sessionExpiresAt: null,
  veraSessionToken: null,
  clearActiveAlertSession: () => set({ activeAlertSessionId: null }),
  lockVeraSession: () =>
    set({
      isUnlocked: false,
      sessionExpiresAt: null,
      veraSessionToken: null,
    }),
  setActiveAlertSessionId: (activeAlertSessionId) =>
    set({ activeAlertSessionId }),
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
