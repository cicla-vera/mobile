import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getCachedEvidenceAnalysis,
  setCachedEvidenceAnalysis,
  veraEvidenceService,
} from '@/services/vera';
import { findVaultEvidenceRecords } from '@/services/vera/security-audio-evidence-records.service';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type { UploadEvidenceRequest } from '@/types/vera.types';
import { veraQueryKeys } from './query-keys';

export function useEvidenceRecordsQuery(alertSessionId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.evidence(alertSessionId),
    queryFn: () => veraEvidenceService.findEvidenceRecords(alertSessionId),
    enabled: isAuthenticated && Boolean(alertSessionId),
  });
}

export function useVaultEvidenceRecordsQuery(alertSessionId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.vaultEvidence(alertSessionId),
    queryFn: () => findVaultEvidenceRecords(alertSessionId),
    enabled: isAuthenticated,
  });
}

export function useCachedEvidenceAnalysisQuery(evidenceRecordId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: veraQueryKeys.evidenceAnalysis(evidenceRecordId),
    queryFn: () => getCachedEvidenceAnalysis(evidenceRecordId),
    enabled: isAuthenticated && Boolean(evidenceRecordId),
  });
}

export function useUploadEvidenceMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'upload-evidence'],
    mutationFn: ({
      alertSessionId,
      payload,
    }: {
      alertSessionId: string;
      payload: UploadEvidenceRequest;
    }) => veraEvidenceService.uploadEvidence(alertSessionId, payload),
    onSuccess: async (record) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.evidence(record.alertSessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.alertTimeline(record.alertSessionId),
        }),
      ]);
    },
  });
}

export function useVerifyEvidenceMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'verify-evidence'],
    mutationFn: ({
      alertSessionId,
      evidenceRecordId,
    }: {
      alertSessionId: string;
      evidenceRecordId: string;
    }) => veraEvidenceService.verifyEvidence(alertSessionId, evidenceRecordId),
  });
}

export function useAnalyzeEvidenceMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'analyze-evidence'],
    mutationFn: ({
      alertSessionId,
      evidenceRecordId,
    }: {
      alertSessionId: string;
      evidenceRecordId: string;
    }) => veraEvidenceService.analyzeEvidence(alertSessionId, evidenceRecordId),
    onSuccess: async (analysis) => {
      await setCachedEvidenceAnalysis(analysis);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.alertTimeline(analysis.alertSessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: veraQueryKeys.evidenceAnalysis(analysis.evidenceRecordId),
        }),
      ]);
    },
  });
}

export function useHideEvidenceMutation() {
  return useMutation({
    mutationKey: [...veraQueryKeys.alertSessions(), 'hide-evidence'],
    mutationFn: ({
      alertSessionId,
      evidenceRecordId,
    }: {
      alertSessionId: string;
      evidenceRecordId: string;
    }) => veraEvidenceService.hideEvidence(alertSessionId, evidenceRecordId),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({
        queryKey: veraQueryKeys.evidence(record.alertSessionId),
      });
    },
  });
}
