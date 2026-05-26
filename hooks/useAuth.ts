import { useMutation } from "@tanstack/react-query";

import { authService } from "@/services/auth.service";
import { cancelManagedLocalNotifications } from "@/services/local-notifications.service";
import { queryClient } from "@/services/query-client";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginRequest, RegisterRequest } from "@/types/api.types";

const authQueryKey = ["auth"] as const;

export function useAuth() {
  return useAuthStore();
}

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationKey: [...authQueryKey, "login"],
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.clear();
      queryClient.setQueryData(authQueryKey, session.user);
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationKey: [...authQueryKey, "register"],
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: async (session) => {
      await setSession(session);
      queryClient.clear();
      queryClient.setQueryData(authQueryKey, session.user);
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return async () => {
    await cancelManagedLocalNotifications();
    await clearSession();
    queryClient.clear();
  };
}
