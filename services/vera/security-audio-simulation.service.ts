import {
  RecordingPresets,
  setAudioModeAsync,
  type RecordingOptions,
} from 'expo-audio';
import type { AudioRecorder } from 'expo-audio/build/AudioModule.types';
import * as FileSystem from 'expo-file-system/legacy';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import {
  SECURITY_AUDIO_CHECKPOINT_FILE,
  SECURITY_AUDIO_POST_TRIGGER_MS,
  SECURITY_AUDIO_SEGMENT_MS,
  SECURITY_AUDIO_TEMP_DIR,
  SECURITY_AUDIO_TRIGGER_MAX_MS,
  SECURITY_AUDIO_TRIGGER_MIN_MS,
  SIMULATED_VIOLENCE_TRIGGERS,
  VERA_SECURITY_AUDIO_TASK_NAME,
} from '@/constants/vera-security-audio';
import {
  hideSecurityModeDiscreetOverlay,
} from '@/services/vera/security-mode-overlay.service';
import { getStoredActiveAlertSessionId } from '@/services/vera/active-alert-storage.service';
import { requestVeraAudioRecordingPermission } from '@/services/vera/native-capabilities.service';
import {
  listSecurityAudioEvidences,
  markSecurityAudioEvidenceUploaded,
  readLocalFilePreviewBase64,
  saveSecurityAudioEvidence,
} from '@/services/vera/security-audio-evidence.service';
import type {
  SecurityAudioCheckpoint,
  SecurityModeSnapshot,
  SecurityModeStatus,
  SimulatedCloudUploadPayload,
} from '@/types/vera-security-audio.types';

type SecurityModeListener = (snapshot: SecurityModeSnapshot) => void;

type ActiveSegment = {
  startedAt: number;
  tempUri: string | null;
};

const listeners = new Set<SecurityModeListener>();

let recorder: AudioRecorder | null = null;
let isActive = false;
let status: SecurityModeStatus = 'idle';
let segmentTimer: ReturnType<typeof setTimeout> | null = null;
let triggerTimer: ReturnType<typeof setTimeout> | null = null;
let postTriggerTimer: ReturnType<typeof setTimeout> | null = null;
let activeSegment: ActiveSegment | null = null;
let postTriggerStartedAt: string | null = null;
let lastDetectedText: string | null = null;
let lastError: string | null = null;
let nextSimulatedTriggerAt: string | null = null;
let cachedEvidences: SecurityModeSnapshot['evidences'] = [];
let isRotatingSegment = false;
let isSealingSegment = false;

defineVeraSecurityAudioTask();

export function subscribeSecurityMode(listener: SecurityModeListener) {
  listeners.add(listener);
  void emitSnapshot();

  return () => {
    listeners.delete(listener);
  };
}

export async function getSecurityModeSnapshot(): Promise<SecurityModeSnapshot> {
  cachedEvidences = await listSecurityAudioEvidences();

  return buildSnapshot();
}

export async function startSecurityMode() {
  if (isActive || status === 'starting') {
    return getSecurityModeSnapshot();
  }

  if (Platform.OS === 'web') {
    throw new Error('Modo Seguranca de audio nao esta disponivel na web.');
  }

  lastError = null;
  setStatus('starting');

  try {
    const permission = await requestVeraAudioRecordingPermission();

    if (!permission.granted) {
      throw new Error('Permissao de microfone negada.');
    }

    await setAudioModeAsync({
      allowsRecording: true,
      allowsBackgroundRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    await ensureTempDirectory();
    isActive = true;
    scheduleNextSimulatedTrigger();
    await startNewSegment();
    await persistCheckpoint();
    setStatus('recording');

    return getSecurityModeSnapshot();
  } catch (error) {
    isActive = false;
    lastError =
      error instanceof Error
        ? error.message
        : 'Nao deu para iniciar o Modo Seguranca.';
    setStatus('error');
    await cleanupTimers();
    await releaseRecorder();
    throw error;
  }
}

export async function stopSecurityMode() {
  if (!isActive && status === 'idle') {
    return getSecurityModeSnapshot();
  }

  setStatus('stopping');
  isActive = false;
  await cleanupTimers();
  await discardCurrentSegment();
  await releaseRecorder();
  await setAudioModeAsync({ allowsRecording: false });
  await hideSecurityModeDiscreetOverlay();
  await persistCheckpoint();
  postTriggerStartedAt = null;
  lastDetectedText = null;
  nextSimulatedTriggerAt = null;
  setStatus('idle');

  return getSecurityModeSnapshot();
}

export async function triggerSimulatedViolenceDetection(customText?: string) {
  if (!isActive || !activeSegment) {
    throw new Error('Ative o Modo Seguranca antes de simular um gatilho.');
  }

  if (status === 'post_trigger' || isSealingSegment) {
    return getSecurityModeSnapshot();
  }

  const detectedText =
    customText?.trim() ||
    pickRandomTriggerText() ||
    SIMULATED_VIOLENCE_TRIGGERS[0];

  lastDetectedText = detectedText;
  postTriggerStartedAt = new Date().toISOString();
  setStatus('post_trigger');

  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }

  if (triggerTimer) {
    clearTimeout(triggerTimer);
    triggerTimer = null;
  }

  if (postTriggerTimer) {
    clearTimeout(postTriggerTimer);
  }

  postTriggerTimer = setTimeout(() => {
    void sealCurrentSegmentAsEvidence(detectedText);
  }, SECURITY_AUDIO_POST_TRIGGER_MS);

  await persistCheckpoint({
    pendingTriggerText: detectedText,
  });
  await emitSnapshot();

  console.log(
    JSON.stringify(
      {
        event: 'vera.security.simulated_ai_trigger',
        detectedText,
        postTriggerEndsAt: new Date(
          Date.now() + SECURITY_AUDIO_POST_TRIGGER_MS,
        ).toISOString(),
      },
      null,
      2,
    ),
  );

  return getSecurityModeSnapshot();
}

export async function processSecurityAudioCheckpoint() {
  const checkpoint = await readCheckpoint();

  if (!checkpoint?.pendingTriggerText || !isActive) {
    return getSecurityModeSnapshot();
  }

  if (Date.now() >= new Date(checkpoint.updatedAt).getTime()) {
    await triggerSimulatedViolenceDetection(checkpoint.pendingTriggerText);
  }

  return getSecurityModeSnapshot();
}

function defineVeraSecurityAudioTask() {
  if (
    Platform.OS === 'web' ||
    TaskManager.isTaskDefined(VERA_SECURITY_AUDIO_TASK_NAME)
  ) {
    return;
  }

  TaskManager.defineTask(VERA_SECURITY_AUDIO_TASK_NAME, async () => {
    try {
      await processSecurityAudioCheckpoint();
    } catch {
      // Background tasks must stay silent.
    }
  });
}

async function startNewSegment() {
  if (!isActive || isRotatingSegment || isSealingSegment) {
    return;
  }

  isRotatingSegment = true;

  try {
    await discardCurrentSegment();
    const nextRecorder = await getRecorder();
    await nextRecorder.prepareToRecordAsync();
    nextRecorder.record();

    activeSegment = {
      startedAt: Date.now(),
      tempUri: nextRecorder.uri ?? null,
    };

    if (segmentTimer) {
      clearTimeout(segmentTimer);
    }

    segmentTimer = setTimeout(() => {
      void rotateSegmentWithoutSaving();
    }, SECURITY_AUDIO_SEGMENT_MS);
  } finally {
    isRotatingSegment = false;
  }
}

async function rotateSegmentWithoutSaving() {
  if (!isActive || status === 'post_trigger' || isSealingSegment) {
    return;
  }

  await startNewSegment();
  await emitSnapshot();
}

async function sealCurrentSegmentAsEvidence(detectedText: string) {
  if (!isActive || isSealingSegment) {
    return;
  }

  isSealingSegment = true;
  setStatus('sealing');

  try {
    const segmentStartedAt = activeSegment?.startedAt ?? Date.now();
    const currentRecorder = recorder;

    if (!currentRecorder) {
      throw new Error('Gravacao ativa nao encontrada.');
    }

    await currentRecorder.stop();
    const sourceUri = currentRecorder.uri;

    if (!sourceUri) {
      throw new Error('Arquivo de audio nao foi gerado.');
    }

    const durationMillis = Math.max(Date.now() - segmentStartedAt, 0);
    const alertSessionId = await getStoredActiveAlertSessionId();
    const evidence = await saveSecurityAudioEvidence({
      detectedText,
      durationMillis,
      sourceUri,
      triggeredAt: postTriggerStartedAt ?? new Date().toISOString(),
      alertSessionId,
    });

    await simulateCloudUpload(evidence);
    await markSecurityAudioEvidenceUploaded(evidence.id);

    postTriggerStartedAt = null;
    lastDetectedText = detectedText;
    cachedEvidences = await listSecurityAudioEvidences();
    recorder = null;

    if (postTriggerTimer) {
      clearTimeout(postTriggerTimer);
      postTriggerTimer = null;
    }

    scheduleNextSimulatedTrigger();

    if (isActive) {
      setStatus('recording');
      await startNewSegment();
    } else {
      setStatus('idle');
    }

    await persistCheckpoint({ pendingTriggerText: null });
    await emitSnapshot();
  } catch (error) {
    lastError =
      error instanceof Error
        ? error.message
        : 'Nao deu para selar a evidencia de audio.';
    setStatus('error');
    await emitSnapshot();
  } finally {
    isSealingSegment = false;
  }
}

async function simulateCloudUpload(
  evidence: SecurityModeSnapshot['evidences'][number],
) {
  const info = await FileSystem.getInfoAsync(evidence.localUri);
  const payload: SimulatedCloudUploadPayload = {
    evidenceId: evidence.id,
    sha256: evidence.sha256,
    mimeType: evidence.mimeType,
    fileName: evidence.fileName,
    fileSizeBytes: info.exists ? info.size ?? 0 : 0,
    detectedText: evidence.detectedText,
    sealedAt: evidence.sealedAt,
    binaryPreviewBase64: await readLocalFilePreviewBase64(evidence.localUri),
  };

  console.log(
    JSON.stringify(
      {
        event: 'vera.security.simulated_cloud_upload',
        endpoint: '/vera/alert-sessions/active/evidence',
        payload,
      },
      null,
      2,
    ),
  );
}

function scheduleNextSimulatedTrigger() {
  if (!isActive) {
    return;
  }

  if (triggerTimer) {
    clearTimeout(triggerTimer);
  }

  const delayMs = randomBetween(
    SECURITY_AUDIO_TRIGGER_MIN_MS,
    SECURITY_AUDIO_TRIGGER_MAX_MS,
  );
  const triggerAt = new Date(Date.now() + delayMs);
  nextSimulatedTriggerAt = triggerAt.toISOString();

  triggerTimer = setTimeout(() => {
    if (!isActive || status === 'post_trigger') {
      return;
    }

    void triggerSimulatedViolenceDetection();
  }, delayMs);

  void persistCheckpoint();
}

async function discardCurrentSegment() {
  const currentRecorder = recorder;

  if (!currentRecorder) {
    activeSegment = null;
    return;
  }

  try {
    if (currentRecorder.isRecording) {
      await currentRecorder.stop();
    }
  } catch {
    // Best effort cleanup for temporary segments.
  }

  const tempUri = currentRecorder.uri ?? activeSegment?.tempUri;

  if (tempUri) {
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
  }

  recorder = null;
  activeSegment = null;
}

async function releaseRecorder() {
  if (!recorder) {
    return;
  }

  try {
    if (recorder.isRecording) {
      await recorder.stop();
    }
  } catch {
    // Ignore stop errors during shutdown.
  }

  recorder = null;
  activeSegment = null;
}

async function getRecorder() {
  if (recorder) {
    return recorder;
  }

  const AudioModule = (await import('expo-audio/build/AudioModule')).default;
  const { createRecordingOptions } = await import(
    'expo-audio/build/utils/options'
  );
  const options = createRecordingOptions(
    RecordingPresets.HIGH_QUALITY as RecordingOptions,
  );

  recorder = new AudioModule.AudioRecorder(options);
  return recorder;
}

async function ensureTempDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('Armazenamento local indisponivel.');
  }

  await FileSystem.makeDirectoryAsync(
    `${FileSystem.documentDirectory}${SECURITY_AUDIO_TEMP_DIR}`,
    { intermediates: true },
  );
}

async function persistCheckpoint(
  partial: Partial<SecurityAudioCheckpoint> = {},
) {
  const checkpoint: SecurityAudioCheckpoint = {
    isActive,
    nextSimulatedTriggerAt,
    pendingTriggerText: partial.pendingTriggerText ?? null,
    updatedAt: new Date().toISOString(),
    ...partial,
  };

  if (!FileSystem.documentDirectory) {
    return;
  }

  await FileSystem.writeAsStringAsync(
    `${FileSystem.documentDirectory}${SECURITY_AUDIO_CHECKPOINT_FILE}`,
    JSON.stringify(checkpoint, null, 2),
  );
}

async function readCheckpoint(): Promise<SecurityAudioCheckpoint | null> {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  const uri = `${FileSystem.documentDirectory}${SECURITY_AUDIO_CHECKPOINT_FILE}`;
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    return null;
  }

  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    return JSON.parse(raw) as SecurityAudioCheckpoint;
  } catch {
    return null;
  }
}

async function cleanupTimers() {
  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }

  if (triggerTimer) {
    clearTimeout(triggerTimer);
    triggerTimer = null;
  }

  if (postTriggerTimer) {
    clearTimeout(postTriggerTimer);
    postTriggerTimer = null;
  }
}

function buildSnapshot(): SecurityModeSnapshot {
  return {
    status,
    isActive,
    segmentStartedAt: activeSegment
      ? new Date(activeSegment.startedAt).toISOString()
      : null,
    postTriggerStartedAt,
    lastDetectedText,
    lastError,
    nextSimulatedTriggerAt,
    evidences: cachedEvidences,
  };
}

async function emitSnapshot() {
  cachedEvidences = await listSecurityAudioEvidences();
  const snapshot = buildSnapshot();

  listeners.forEach((listener) => {
    listener(snapshot);
  });
}

function setStatus(nextStatus: SecurityModeStatus) {
  status = nextStatus;
}

function pickRandomTriggerText() {
  const index = Math.floor(Math.random() * SIMULATED_VIOLENCE_TRIGGERS.length);
  return SIMULATED_VIOLENCE_TRIGGERS[index];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const veraSecurityAudioSimulationService = {
  getSecurityModeSnapshot,
  processSecurityAudioCheckpoint,
  startSecurityMode,
  stopSecurityMode,
  subscribeSecurityMode,
  triggerSimulatedViolenceDetection,
};
