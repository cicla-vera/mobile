import * as FileSystem from 'expo-file-system/legacy';

import {
  analyzeEvidence,
  uploadEvidence,
} from '@/services/vera/evidence.service';
import type {
  EvidenceRecord,
  EvidenceType,
  UploadEvidenceRequest,
  VeraMetadata,
} from '@/types/vera.types';

export type QueuedEvidenceUploadStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed';

export type QueuedEvidenceUpload = {
  id: string;
  alertSessionId: string;
  type: EvidenceType;
  localUri: string;
  fileName: string;
  mimeType: string;
  size: number;
  metadata: VeraMetadata | null;
  status: QueuedEvidenceUploadStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  errorMessage: string | null;
  uploadedEvidenceRecordId: string | null;
};

export type EnqueueEvidenceUploadInput = {
  alertSessionId: string;
  fileName: string;
  metadata?: VeraMetadata;
  mimeType: string;
  size?: number;
  sourceUri: string;
  type: EvidenceType;
};

export type FlushEvidenceUploadQueueResult = {
  failed: QueuedEvidenceUpload[];
  uploaded: EvidenceRecord[];
};

const QUEUE_FILE_NAME = 'vera-evidence-upload-queue.json';
const QUEUE_FILES_DIR_NAME = 'vera-evidence-uploads/';
const RETRY_BACKOFF_MS = [
  30 * 1000,
  60 * 1000,
  2 * 60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
];
const STALE_UPLOAD_RETRY_MS = 2 * 60 * 1000;
let queueFileTail: Promise<void> = Promise.resolve();
let flushQueueTail: Promise<void> = Promise.resolve();

export async function listQueuedEvidenceUploads(alertSessionId?: string) {
  const items = await runQueueFileOperation(() => readQueue());

  if (!alertSessionId) {
    return items;
  }

  return items.filter((item) => item.alertSessionId === alertSessionId);
}

export async function enqueueEvidenceUpload(input: EnqueueEvidenceUploadInput) {
  await ensureQueueDirectory();

  const now = new Date().toISOString();
  const id = createQueueId();
  const localUri = await copyEvidenceIntoQueue(input, id);
  const size = input.size ?? (await getFileSize(localUri));
  const item: QueuedEvidenceUpload = {
    id,
    alertSessionId: input.alertSessionId,
    type: input.type,
    localUri,
    fileName: sanitizeFileName(input.fileName, input.type),
    mimeType: input.mimeType,
    size,
    metadata: input.metadata ?? null,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    nextAttemptAt: null,
    errorMessage: null,
    uploadedEvidenceRecordId: null,
  };

  await runQueueFileOperation(async () => {
    await writeQueue([item, ...(await readQueue())]);
  });

  return item;
}

export function flushEvidenceUploadQueue(alertSessionId?: string) {
  const nextFlush = flushQueueTail.then(
    () => flushEvidenceUploadQueueOnce(alertSessionId),
    () => flushEvidenceUploadQueueOnce(alertSessionId),
  );

  flushQueueTail = nextFlush.then(
    () => undefined,
    () => undefined,
  );

  return nextFlush;
}

async function flushEvidenceUploadQueueOnce(alertSessionId?: string) {
  const result: FlushEvidenceUploadQueueResult = {
    failed: [],
    uploaded: [],
  };
  const nowMs = Date.now();
  const items = await runQueueFileOperation(() => readQueue());
  const candidates = items.filter(
    (item) =>
      item.status !== 'uploaded' &&
      isQueuedEvidenceUploadDue(item, nowMs) &&
      (!alertSessionId || item.alertSessionId === alertSessionId),
  );

  for (const item of candidates) {
    try {
      const record = await uploadQueuedEvidence(item);
      result.uploaded.push(record);
    } catch {
      const updated = await findQueuedEvidenceUpload(item.id);

      if (updated) {
        result.failed.push(updated);
      }
    }
  }

  return result;
}

export async function retryQueuedEvidenceUpload(id: string) {
  const item = (await runQueueFileOperation(() => readQueue())).find(
    (candidate) => candidate.id === id,
  );

  if (!item) {
    return null;
  }

  return uploadQueuedEvidence(item);
}

export function getQueuedEvidenceUploadRetryDelayMs(
  item: QueuedEvidenceUpload,
  nowMs = Date.now(),
) {
  if (item.status !== 'failed') {
    return 0;
  }

  const nextAttemptAt = getTimeMs(item.nextAttemptAt);

  return nextAttemptAt === null ? 0 : Math.max(0, nextAttemptAt - nowMs);
}

export async function removeQueuedEvidenceUpload(id: string) {
  await runQueueFileOperation(async () => {
    const items = await readQueue();
    const item = items.find((candidate) => candidate.id === id);

    if (item) {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
    }

    await writeQueue(items.filter((candidate) => candidate.id !== id));
  });
}

async function uploadQueuedEvidence(item: QueuedEvidenceUpload) {
  const startedAt = new Date().toISOString();

  await updateQueuedEvidence(item.id, (current) => ({
    ...current,
    status: 'uploading',
    attempts: current.attempts + 1,
    lastAttemptAt: startedAt,
    nextAttemptAt: null,
    updatedAt: startedAt,
    errorMessage: null,
  }));

  try {
    const record = await uploadEvidence(item.alertSessionId, {
      type: item.type,
      file: {
        uri: item.localUri,
        name: item.fileName,
        type: item.mimeType,
      },
      metadata: {
        ...(item.metadata ?? {}),
        queuedEvidenceUploadId: item.id,
      },
    } satisfies UploadEvidenceRequest);
    const updatedAt = new Date().toISOString();

    await updateQueuedEvidence(item.id, (current) => ({
      ...current,
      status: 'uploaded',
      updatedAt,
      errorMessage: null,
      nextAttemptAt: null,
      uploadedEvidenceRecordId: record.id,
    }));
    await requestAnalysisForUploadedAudio(record);
    await FileSystem.deleteAsync(item.localUri, { idempotent: true });

    return record;
  } catch (error) {
    const failedAtMs = Date.now();
    const updatedAt = new Date(failedAtMs).toISOString();

    await updateQueuedEvidence(item.id, (current) => ({
      ...current,
      status: 'failed',
      updatedAt,
      nextAttemptAt: getNextAttemptAt(current.attempts, failedAtMs),
      errorMessage:
        error instanceof Error ? error.message : 'Upload não concluído.',
    }));

    throw error;
  }
}

async function findQueuedEvidenceUpload(id: string) {
  return (
    (await runQueueFileOperation(() => readQueue())).find(
      (candidate) => candidate.id === id,
    ) ?? null
  );
}

function isQueuedEvidenceUploadDue(
  item: QueuedEvidenceUpload,
  nowMs = Date.now(),
) {
  if (item.status === 'pending') {
    return true;
  }

  if (item.status === 'uploading') {
    const lastAttemptAt = getTimeMs(item.lastAttemptAt);

    return (
      lastAttemptAt === null || nowMs - lastAttemptAt >= STALE_UPLOAD_RETRY_MS
    );
  }

  if (item.status !== 'failed') {
    return false;
  }

  const nextAttemptAt = getTimeMs(item.nextAttemptAt);

  return nextAttemptAt === null || nextAttemptAt <= nowMs;
}

function getNextAttemptAt(attempts: number, fromMs = Date.now()) {
  const delayIndex = Math.min(
    Math.max(0, attempts - 1),
    RETRY_BACKOFF_MS.length - 1,
  );

  return new Date(fromMs + RETRY_BACKOFF_MS[delayIndex]).toISOString();
}

function getTimeMs(value: string | null) {
  if (!value) {
    return null;
  }

  const timeMs = new Date(value).getTime();

  return Number.isFinite(timeMs) ? timeMs : null;
}

async function requestAnalysisForUploadedAudio(record: EvidenceRecord) {
  if (record.type !== 'AUDIO') {
    return;
  }

  try {
    await analyzeEvidence(record.alertSessionId, record.id);
  } catch {
    // Evidence upload is the custody boundary; analysis failures are persisted
    // server-side when possible and must not make the local upload retry.
  }
}

async function updateQueuedEvidence(
  id: string,
  updater: (item: QueuedEvidenceUpload) => QueuedEvidenceUpload,
) {
  return runQueueFileOperation(async () => {
    const items = await readQueue();
    let updatedItem: QueuedEvidenceUpload | null = null;
    const updatedItems = items.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedItem = updater(item);
      return updatedItem;
    });

    await writeQueue(updatedItems);

    return [updatedItem, updatedItems] as const;
  });
}

function runQueueFileOperation<T>(operation: () => Promise<T>) {
  const nextOperation = queueFileTail.then(operation, operation);

  queueFileTail = nextOperation.then(
    () => undefined,
    () => undefined,
  );

  return nextOperation;
}

async function readQueue(): Promise<QueuedEvidenceUpload[]> {
  const fileUri = getQueueFileUri();
  const info = await FileSystem.getInfoAsync(fileUri);

  if (!info.exists) {
    return [];
  }

  try {
    const raw = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter(isQueuedEvidenceUpload).map(normalizeQueuedEvidenceUpload)
      : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedEvidenceUpload[]) {
  await ensureQueueDirectory();
  await FileSystem.writeAsStringAsync(
    getQueueFileUri(),
    JSON.stringify(items, null, 2),
  );
}

async function copyEvidenceIntoQueue(
  input: EnqueueEvidenceUploadInput,
  id: string,
) {
  const destinationUri = `${getQueueFilesDirUri()}${id}-${sanitizeFileName(
    input.fileName,
    input.type,
  )}`;

  await FileSystem.copyAsync({
    from: input.sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

async function ensureQueueDirectory() {
  await FileSystem.makeDirectoryAsync(getQueueFilesDirUri(), {
    intermediates: true,
  });
}

async function getFileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);

  return info.exists ? info.size : 0;
}

function getQueueFileUri() {
  return `${getDocumentDirectory()}${QUEUE_FILE_NAME}`;
}

function getQueueFilesDirUri() {
  return `${getDocumentDirectory()}${QUEUE_FILES_DIR_NAME}`;
}

function getDocumentDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('Armazenamento local de evidências indisponível.');
  }

  return FileSystem.documentDirectory;
}

function sanitizeFileName(fileName: string, type: EvidenceType) {
  const fallbackExtension = getFallbackExtension(type);
  const sanitized = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

  if (!sanitized) {
    return `evidence-${Date.now()}.${fallbackExtension}`;
  }

  return sanitized.includes('.')
    ? sanitized
    : `${sanitized}.${fallbackExtension}`;
}

function getFallbackExtension(type: EvidenceType) {
  const extensionByType: Record<EvidenceType, string> = {
    AUDIO: 'm4a',
    FILE: 'bin',
    IMAGE: 'jpg',
    VIDEO: 'mp4',
  };

  return extensionByType[type];
}

function createQueueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isQueuedEvidenceUpload(value: unknown): value is QueuedEvidenceUpload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<QueuedEvidenceUpload>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.alertSessionId === 'string' &&
    typeof candidate.localUri === 'string' &&
    typeof candidate.fileName === 'string' &&
    typeof candidate.mimeType === 'string'
  );
}

function normalizeQueuedEvidenceUpload(
  item: QueuedEvidenceUpload,
): QueuedEvidenceUpload {
  return {
    ...item,
    nextAttemptAt:
      typeof item.nextAttemptAt === 'string' ? item.nextAttemptAt : null,
  };
}
