import { useMutation, useQuery } from '@tanstack/react-query';

import {
  enqueueEvidenceUpload,
  flushEvidenceUploadQueue,
  listQueuedEvidenceUploads,
  removeQueuedEvidenceUpload,
  retryQueuedEvidenceUpload,
  type EnqueueEvidenceUploadInput,
} from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { veraQueryKeys } from './query-keys';

export function useEvidenceUploadQueueQuery(alertSessionId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.evidenceUploadQueue(alertSessionId),
    queryFn: () => listQueuedEvidenceUploads(alertSessionId),
    enabled: isAuthenticated && Boolean(alertSessionId),
    refetchInterval: 10000,
  });
}

export function useEnqueueEvidenceUploadMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'enqueue-evidence-upload'],
    mutationFn: (payload: EnqueueEvidenceUploadInput) =>
      enqueueEvidenceUpload(payload),
    onSuccess: async (item) => {
      await invalidateEvidenceUploadState(item.alertSessionId);
    },
  });
}

export function useFlushEvidenceUploadQueueMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'flush-evidence-uploads'],
    mutationFn: (alertSessionId?: string) =>
      flushEvidenceUploadQueue(alertSessionId),
    onSuccess: async (result) => {
      const alertSessionIds = new Set(
        [
          ...result.uploaded.map((record) => record.alertSessionId),
          ...result.failed.map((item) => item.alertSessionId),
        ].filter(Boolean),
      );

      await Promise.all(
        [...alertSessionIds].map((alertSessionId) =>
          invalidateEvidenceUploadState(alertSessionId),
        ),
      );
    },
  });
}

export function useRetryQueuedEvidenceUploadMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'retry-evidence-upload'],
    mutationFn: (id: string) => retryQueuedEvidenceUpload(id),
    onSuccess: async (record) => {
      if (record) {
        await invalidateEvidenceUploadState(record.alertSessionId);
      }
    },
  });
}

export function useRemoveQueuedEvidenceUploadMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'remove-evidence-upload'],
    mutationFn: ({
      alertSessionId,
      id,
    }: {
      alertSessionId: string;
      id: string;
    }) => removeQueuedEvidenceUpload(id).then(() => alertSessionId),
    onSuccess: async (alertSessionId) => {
      await invalidateEvidenceUploadState(alertSessionId);
    },
  });
}

async function invalidateEvidenceUploadState(alertSessionId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: veraQueryKeys.evidence(alertSessionId),
    }),
    queryClient.invalidateQueries({
      queryKey: veraQueryKeys.evidenceUploadQueue(alertSessionId),
    }),
    queryClient.invalidateQueries({
      queryKey: veraQueryKeys.alertTimeline(alertSessionId),
    }),
  ]);
}
