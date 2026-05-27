import * as FileSystem from 'expo-file-system/legacy';

import {
  SECURITY_AUDIO_EVIDENCE_DIR,
  SECURITY_AUDIO_MANIFEST_FILE,
  SECURITY_AUDIO_MIME_TYPE,
} from '@/constants/vera-security-audio';
import { sha256FromBase64 } from '@/services/vera/file-hash.service';
import type { SecurityAudioEvidence } from '@/types/vera-security-audio.types';

export async function listSecurityAudioEvidences() {
  const manifest = await readManifest();
  return manifest.sort(
    (first, second) =>
      new Date(second.sealedAt).getTime() - new Date(first.sealedAt).getTime(),
  );
}

export async function saveSecurityAudioEvidence(input: {
  detectedText: string;
  durationMillis: number;
  sourceUri: string;
  triggeredAt: string;
  alertSessionId?: string | null;
}) {
  await ensureEvidenceDirectory();

  const id = createEvidenceId();
  const fileName = `vera-evidence-${id}.m4a`;
  const destinationUri = `${getEvidenceDirectory()}${fileName}`;

  await FileSystem.moveAsync({
    from: input.sourceUri,
    to: destinationUri,
  });

  const sha256 = await hashLocalFile(destinationUri);
  const fileInfo = await FileSystem.getInfoAsync(destinationUri);
  const fileSizeBytes = fileInfo.exists ? fileInfo.size ?? 0 : 0;
  const sealedAt = new Date().toISOString();
  const evidence: SecurityAudioEvidence = {
    id,
    fileName,
    localUri: destinationUri,
    sha256,
    detectedText: input.detectedText,
    triggeredAt: input.triggeredAt,
    sealedAt,
    durationMillis: input.durationMillis,
    mimeType: SECURITY_AUDIO_MIME_TYPE,
    uploadSimulatedAt: null,
    alertSessionId: input.alertSessionId ?? null,
    fileSizeBytes,
  };

  await writeManifest([evidence, ...(await readManifest())]);

  return evidence;
}

export async function markSecurityAudioEvidenceUploaded(id: string) {
  const items = await readManifest();
  const updatedAt = new Date().toISOString();
  let updatedEvidence: SecurityAudioEvidence | null = null;

  const nextItems = items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    updatedEvidence = {
      ...item,
      uploadSimulatedAt: updatedAt,
    };

    return updatedEvidence;
  });

  await writeManifest(nextItems);

  return updatedEvidence;
}

export async function hashLocalFile(uri: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return sha256FromBase64(base64);
}

export async function readLocalFilePreviewBase64(uri: string, maxBytes = 96) {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists || !info.size) {
    return '';
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const approxChars = Math.ceil((maxBytes * 4) / 3);
  return base64.slice(0, approxChars);
}

async function readManifest(): Promise<SecurityAudioEvidence[]> {
  const fileUri = getManifestUri();
  const info = await FileSystem.getInfoAsync(fileUri);

  if (!info.exists) {
    return [];
  }

  try {
    const raw = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter(isSecurityAudioEvidence).map(normalizeSecurityAudioEvidence)
      : [];
  } catch {
    return [];
  }
}

async function writeManifest(items: SecurityAudioEvidence[]) {
  await ensureEvidenceDirectory();
  await FileSystem.writeAsStringAsync(
    getManifestUri(),
    JSON.stringify(items, null, 2),
  );
}

async function ensureEvidenceDirectory() {
  await FileSystem.makeDirectoryAsync(getEvidenceDirectory(), {
    intermediates: true,
  });
}

function getManifestUri() {
  return `${getEvidenceDirectory()}${SECURITY_AUDIO_MANIFEST_FILE}`;
}

function getEvidenceDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('Armazenamento local de evidencias indisponivel.');
  }

  return `${FileSystem.documentDirectory}${SECURITY_AUDIO_EVIDENCE_DIR}`;
}

function createEvidenceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSecurityAudioEvidence(
  evidence: SecurityAudioEvidence,
): SecurityAudioEvidence {
  return {
    ...evidence,
    alertSessionId: evidence.alertSessionId ?? null,
    fileSizeBytes: evidence.fileSizeBytes ?? 0,
  };
}

function isSecurityAudioEvidence(
  value: unknown,
): value is SecurityAudioEvidence {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SecurityAudioEvidence>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.fileName === 'string' &&
    typeof candidate.localUri === 'string' &&
    typeof candidate.sha256 === 'string' &&
    typeof candidate.detectedText === 'string' &&
    typeof candidate.triggeredAt === 'string' &&
    typeof candidate.sealedAt === 'string' &&
    typeof candidate.durationMillis === 'number' &&
    typeof candidate.mimeType === 'string' &&
    (candidate.alertSessionId === undefined ||
      candidate.alertSessionId === null ||
      typeof candidate.alertSessionId === 'string') &&
    (candidate.fileSizeBytes === undefined ||
      typeof candidate.fileSizeBytes === 'number')
  );
}
