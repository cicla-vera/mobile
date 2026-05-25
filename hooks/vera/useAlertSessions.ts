import { useMutation, useQuery } from '@tanstack/react-query';

import { veraAlertSessionsService } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { useVeraStore } from '@/stores/vera.store';
import type {
  CloseAlertSessionRequest,
  CreateAlertEventRequest,
  StartLocationAlertSessionRequest,
  StartManualAlertSessionRequest,
} from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useActiveAlertSessionQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.activeAlertSession(),
    queryFn: veraAlertSessionsService.findActiveAlertSession,
    enabled: isAuthenticated,
  });
}

export function useAlertSessionQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.alertSession(id),
    queryFn: () => veraAlertSessionsService.getAlertSession(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useAlertTimelineQuery(alertSessionId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.alertTimeline(alertSessionId),
    queryFn: () => veraAlertSessionsService.findAlertTimeline(alertSessionId),
    enabled: isAuthenticated && Boolean(alertSessionId),
  });
}

export function useStartManualAlertSessionMutation() {
  const setActiveAlertSessionId = useVeraStore(
    (state) => state.setActiveAlertSessionId,
  );

  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'start-manual'],
    mutationFn: (payload?: StartManualAlertSessionRequest) =>
      veraAlertSessionsService.startManualAlertSession(payload),
    onSuccess: async (session) => {
      setActiveAlertSessionId(session.id);
      queryClient.setQueryData(veraQueryKeys.activeAlertSession(), session);
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.alertSessions(),
      });
    },
  });
}

export function useStartLocationAlertSessionMutation() {
  const setActiveAlertSessionId = useVeraStore(
    (state) => state.setActiveAlertSessionId,
  );

  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'start-location'],
    mutationFn: (payload: StartLocationAlertSessionRequest) =>
      veraAlertSessionsService.startLocationAlertSession(payload),
    onSuccess: async (session) => {
      setActiveAlertSessionId(session.id);
      queryClient.setQueryData(veraQueryKeys.activeAlertSession(), session);
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.alertSessions(),
      });
    },
  });
}

export function useCloseAlertSessionMutation() {
  const clearActiveAlertSession = useVeraStore(
    (state) => state.clearActiveAlertSession,
  );

  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'close'],
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CloseAlertSessionRequest;
    }) => veraAlertSessionsService.closeAlertSession(id, payload),
    onSuccess: async (session) => {
      clearActiveAlertSession();
      queryClient.setQueryData(veraQueryKeys.alertSession(session.id), session);
      queryClient.setQueryData(veraQueryKeys.activeAlertSession(), null);
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.alertSessions(),
      });
    },
  });
}

export function useDispatchEmergencyContactsMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'dispatch-contacts'],
    mutationFn: (id: string) =>
      veraAlertSessionsService.dispatchEmergencyContacts(id),
    onSuccess: async (session) => {
      queryClient.setQueryData(veraQueryKeys.alertSession(session.id), session);
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.alertSessions(),
      });
    },
  });
}

export function useCreateAlertEventMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'create-event'],
    mutationFn: ({
      alertSessionId,
      payload,
    }: {
      alertSessionId: string;
      payload: CreateAlertEventRequest;
    }) => veraAlertSessionsService.createAlertEvent(alertSessionId, payload),
    onSuccess: async (event) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.alertSession(event.alertSessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.alertTimeline(event.alertSessionId),
        }),
      ]);
    },
  });
}
