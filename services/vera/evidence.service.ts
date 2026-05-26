import { api } from '@/services/api';
import { isVeraDemoModeEnabled } from '@/constants/demo';
import {
  VERA_DEMO_ANALYSIS,
  VERA_DEMO_EVIDENCE,
} from '@/services/demo/vera-demo-data';
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
  if (isVeraDemoModeEnabled) {
    return VERA_DEMO_EVIDENCE.filter(
      (record) => record.alertSessionId === alertSessionId,
    );
  }

  const response = await api.get<EvidenceRecord[]>(
    `/vera/alert-sessions/${alertSessionId}/evidence`,
  );

  return response.data;
}

export async function uploadEvidence(
  alertSessionId: string,
  payload: UploadEvidenceRequest,
) {
  if (isVeraDemoModeEnabled) {
    return {
      id: `demo-evidence-${Date.now()}`,
      userId: 'demo-user-vera',
      alertSessionId,
      type: payload.type,
      size: 1024,
      mimeType: getDemoMimeType(payload),
      originalName: getDemoOriginalName(payload),
      contentHash:
        'demo-hash-000000000000000000000000000000000000000000000000',
      hashAlgorithm: 'SHA-256',
      hashedAt: new Date().toISOString(),
      hiddenFromUserAt: null,
      retentionUntil: null,
      deletedAt: null,
      metadata: payload.metadata ?? null,
      createdAt: new Date().toISOString(),
    } satisfies EvidenceRecord;
  }

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
  if (isVeraDemoModeEnabled) {
    const record =
      VERA_DEMO_EVIDENCE.find((item) => item.id === evidenceRecordId) ??
      VERA_DEMO_EVIDENCE[0];

    return {
      evidenceRecordId,
      hashAlgorithm: record.hashAlgorithm,
      storedHash: record.contentHash,
      calculatedHash: record.contentHash,
      matches: true,
      checkedAt: new Date().toISOString(),
    } satisfies EvidenceVerification;
  }

  const response = await api.post<EvidenceVerification>(
    `/vera/alert-sessions/${alertSessionId}/evidence/${evidenceRecordId}/verify`,
  );

  return response.data;
}

export async function analyzeEvidence(
  alertSessionId: string,
  evidenceRecordId: string,
) {
  if (isVeraDemoModeEnabled) {
    return {
      ...VERA_DEMO_ANALYSIS,
      alertSessionId,
      evidenceRecordId,
    };
  }

  const response = await api.post<EvidenceAnalysis>(
    `/vera/alert-sessions/${alertSessionId}/evidence/${evidenceRecordId}/analyze`,
  );

  return response.data;
}

export async function hideEvidence(
  alertSessionId: string,
  evidenceRecordId: string,
) {
  if (isVeraDemoModeEnabled) {
    const record =
      VERA_DEMO_EVIDENCE.find((item) => item.id === evidenceRecordId) ??
      VERA_DEMO_EVIDENCE[0];

    return {
      ...record,
      alertSessionId,
      hiddenFromUserAt: new Date().toISOString(),
    };
  }

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

function getDemoMimeType(payload: UploadEvidenceRequest) {
  if (payload.file && typeof payload.file === 'object' && 'type' in payload.file) {
    return payload.file.type;
  }

  return 'application/octet-stream';
}

function getDemoOriginalName(payload: UploadEvidenceRequest) {
  if (payload.file && typeof payload.file === 'object' && 'name' in payload.file) {
    return payload.file.name;
  }

  return `demo-evidence-${payload.type.toLowerCase()}`;
}
