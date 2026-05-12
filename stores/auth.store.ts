import { create } from 'zustand';

import { setAuthTokenGetter } from '@/services/auth-token';
import {
  deleteStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/services/token-storage';
import type { AuthSession, AuthUser } from '@/types/api.types';

type AuthState = {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrateSession: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  token: null,
  user: null,
  isAuthenticated: false,
  hydrateSession: async () => {
    if (get().isHydrated) {
      return;
    }

    try {
      const token = await getStoredAuthToken();

      set({
        token,
        user: null,
        isAuthenticated: Boolean(token),
        isHydrated: true,
      });
    } catch {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
  setSession: async (session) => {
    await setStoredAuthToken(session.token);

    set({
      token: session.token,
      user: session.user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },
  clearSession: async () => {
    await deleteStoredAuthToken();

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.token),
    })),
}));

setAuthTokenGetter(() => useAuthStore.getState().token);
