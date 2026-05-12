import { create } from 'zustand';

import { setAuthTokenGetter } from '@/services/auth-token';
import type { AuthSession, AuthUser } from '@/types/api.types';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (session) =>
    set({
      token: session.token,
      user: session.user,
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    }),
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.token && user),
    })),
}));

setAuthTokenGetter(() => useAuthStore.getState().token);
