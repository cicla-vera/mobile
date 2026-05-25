import { api } from '@/services/api';
import type {
  EvidenceAnalysis,
  EvidenceRecord,
  EvidenceVerification,
  UploadEvidenceRequest,
} from '@/types/vera.types';

export function buildEvidenceFormData(payload: UploadEvidenceRequest) {
  const formData = new FormData();

  formData.append('type', payload.type);
  formData.append('file', payload.file as Blob);

  if (payload.metadata) {
    formData.append('metadata', JSON.stringify(payload.metadata));
  }

  return formData;
}

export async function findEvidenceRecords(alertSessionId: string) {
  const response = await api.get<EvidenceRecord[]>(
    `/vera/alert-sessions/${alertSessionId}/evidence`,
  );

  return response.data;
}

export async function uploadEvidence(
  alertSessionId: string,
  payload: UploadEvidenceRequest,
) {
  const response = await api.post<EvidenceRecord>(
    `/vera/alert-sessions/${alertSessionId}/evidence`,
    buildEvidenceFormData(payload),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

export async function verifyEvidence(
  alertSessionId: string,
  evidenceRecordId: string,
) {
  const response = await api.post<EvidenceVerification>(
    `/vera/alert-sessions/${alertSessionId}/evidence/${evidenceRecordId}/verify`,
  );

  return response.data;
}

export async function analyzeEvidence(
  alertSessionId: string,
  evidenceRecordId: string,
) {
  const response = await api.post<EvidenceAnalysis>(
    `/vera/alert-sessions/${alertSessionId}/evidence/${evidenceRecordId}/analyze`,
  );

  return response.data;
}

export async function hideEvidence(
  alertSessionId: string,
  evidenceRecordId: string,
) {
  const response = await api.delete<EvidenceRecord>(
    `/vera/alert-sessions/${alertSessionId}/evidence/${evidenceRecordId}`,
  );

  return response.data;
}

export const veraEvidenceService = {
  buildEvidenceFormData,
  findEvidenceRecords,
  uploadEvidence,
  verifyEvidence,
  analyzeEvidence,
  hideEvidence,
};
