import {
  LOCAL_SECURITY_EVIDENCE_ID_PREFIX,
  LOCAL_SECURITY_EVIDENCE_SESSION_ID,
} from '@/constants/vera-security-audio';
import { findEvidenceRecords } from '@/services/vera/evidence.service';
import { listSecurityAudioEvidences } from '@/services/vera/security-audio-evidence.service';
import type { SecurityAudioEvidence } from '@/types/vera-security-audio.types';
import type { EvidenceRecord } from '@/types/vera.types';

export function isLocalSecurityEvidenceRecord(
  evidenceRecordId: string,
): boolean {
  return evidenceRecordId.startsWith(LOCAL_SECURITY_EVIDENCE_ID_PREFIX);
}

export function buildLocalSecurityEvidenceRecordId(
  securityEvidenceId: string,
) {
  return `${LOCAL_SECURITY_EVIDENCE_ID_PREFIX}${securityEvidenceId}`;
}

export function parseLocalSecurityEvidenceId(evidenceRecordId: string) {
  if (!isLocalSecurityEvidenceRecord(evidenceRecordId)) {
    return null;
  }

  return evidenceRecordId.slice(LOCAL_SECURITY_EVIDENCE_ID_PREFIX.length);
}

export function mapSecurityAudioToEvidenceRecord(
  evidence: SecurityAudioEvidence,
): EvidenceRecord {
  const alertSessionId =
    evidence.alertSessionId ?? LOCAL_SECURITY_EVIDENCE_SESSION_ID;

  return {
    id: buildLocalSecurityEvidenceRecordId(evidence.id),
    userId: 'local-security-mode',
    alertSessionId,
    type: 'AUDIO',
    size: evidence.fileSizeBytes ?? 0,
    mimeType: evidence.mimeType,
    originalName: evidence.fileName,
    contentHash: evidence.sha256,
    hashAlgorithm: 'SHA-256',
    hashedAt: evidence.sealedAt,
    hiddenFromUserAt: null,
    retentionUntil: null,
    deletedAt: null,
    metadata: {
      source: 'security_mode',
      detectedText: evidence.detectedText,
      triggeredAt: evidence.triggeredAt,
      durationMillis: evidence.durationMillis,
      localUri: evidence.localUri,
      uploadSimulatedAt: evidence.uploadSimulatedAt,
    },
    createdAt: evidence.sealedAt,
  };
}

export async function listSecurityAudioEvidenceRecords(options?: {
  alertSessionId?: string | null;
  includeUnassigned?: boolean;
}) {
  const items = await listSecurityAudioEvidences();
  const alertSessionId = options?.alertSessionId ?? null;
  const includeUnassigned = options?.includeUnassigned ?? true;

  const filtered = items.filter((item) => {
    if (!alertSessionId) {
      return true;
    }

    if (!item.alertSessionId) {
      return includeUnassigned;
    }

    return item.alertSessionId === alertSessionId;
  });

  return filtered.map(mapSecurityAudioToEvidenceRecord);
}

export async function findLocalSecurityEvidenceRecord(
  evidenceRecordId: string,
) {
  const securityEvidenceId = parseLocalSecurityEvidenceId(evidenceRecordId);

  if (!securityEvidenceId) {
    return null;
  }

  const items = await listSecurityAudioEvidences();
  const match = items.find((item) => item.id === securityEvidenceId);

  return match ? mapSecurityAudioToEvidenceRecord(match) : null;
}

export async function findVaultEvidenceRecords(alertSessionId: string | null) {
  const remoteRecords = alertSessionId
    ? await findEvidenceRecords(alertSessionId)
    : [];

  const localRecords = await listSecurityAudioEvidenceRecords({
    alertSessionId,
    includeUnassigned: Boolean(alertSessionId),
  });

  return mergeEvidenceRecords(remoteRecords, localRecords);
}

function mergeEvidenceRecords(
  remoteRecords: EvidenceRecord[],
  localRecords: EvidenceRecord[],
) {
  const merged = new Map<string, EvidenceRecord>();

  remoteRecords.forEach((record) => {
    merged.set(record.id, record);
  });

  localRecords.forEach((record) => {
    merged.set(record.id, record);
  });

  return Array.from(merged.values()).sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}
