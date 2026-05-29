import * as FileSystem from 'expo-file-system/legacy';
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useVeraProfileQuery } from '@/hooks/vera';
import {
  analyzeAudioSentinelMetering,
  AUDIO_SENTINEL_CHUNK_MS,
  AUDIO_SENTINEL_POST_ROLL_MS,
  AUDIO_SENTINEL_PRE_ROLL_MS,
  buildAudioSentinelMetadata,
  enqueueEvidenceUpload,
  flushEvidenceUploadQueue,
  requestVeraAudioRecordingPermission,
  type AudioSentinelChunkSignal,
  type AudioSentinelChunkSource,
} from '@/services/vera';
import { useAuthStore } from '@/stores/auth.store';
import { useVeraStore } from '@/stores/vera.store';

type VeraAudioSentinelProviderProps = {
  children: ReactNode;
};

type PendingAudioChunk = {
  captureEndedAt: string;
  captureStartedAt: string;
  chunkIndex: number;
  signal: AudioSentinelChunkSignal;
  uri: string;
};

const AUDIO_SENTINEL_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  bitRate: 64000,
  isMeteringEnabled: true,
  numberOfChannels: 1,
};
const AUDIO_SENTINEL_PRE_ROLL_DIR_NAME = 'vera-audio-sentinel-pre-roll/';

export function VeraAudioSentinelProvider({
  children,
}: VeraAudioSentinelProviderProps) {
  const audioRecorder = useAudioRecorder(AUDIO_SENTINEL_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 500);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeAlertSessionId = useVeraStore(
    (state) => state.activeAlertSessionId,
  );
  const profileQuery = useVeraProfileQuery();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const enabled = useMemo(() => {
    const profile = profileQuery.data;

    return Boolean(
      Platform.OS !== 'web' &&
      appState === 'active' &&
      isAuthHydrated &&
      isAuthenticated &&
      activeAlertSessionId &&
      profile?.consentAccepted === true &&
      profile?.veraEnabled === true &&
      profile?.monitoringEnabled === true,
    );
  }, [
    activeAlertSessionId,
    appState,
    isAuthHydrated,
    isAuthenticated,
    profileQuery.data,
  ]);
  const enabledRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const chunkStartedAtRef = useRef<string | null>(null);
  const chunkIndexRef = useRef(0);
  const meteringSamplesRef = useRef<number[]>([]);
  const postRollChunksRemainingRef = useRef(0);
  const previousQuietChunkRef = useRef<PendingAudioChunk | null>(null);
  const recorderStateRef = useRef(recorderState);
  const activeAlertSessionIdRef = useRef(activeAlertSessionId);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    recorderStateRef.current = recorderState;
  }, [recorderState]);

  useEffect(() => {
    activeAlertSessionIdRef.current = activeAlertSessionId;
  }, [activeAlertSessionId]);

  useEffect(() => {
    enabledRef.current = enabled;

    if (enabled) {
      void ensureSentinelStarted();
      return;
    }

    void stopSentinel();
  }, [enabled]);

  useEffect(() => {
    return () => {
      enabledRef.current = false;
      void stopSentinel();
    };
  }, []);

  useEffect(() => {
    if (!enabledRef.current || !recorderState.isRecording) {
      return;
    }

    if (typeof recorderState.metering === 'number') {
      meteringSamplesRef.current.push(recorderState.metering);
    }

    if (recorderState.durationMillis >= AUDIO_SENTINEL_CHUNK_MS) {
      void finishCurrentChunk();
    }
  }, [
    recorderState.durationMillis,
    recorderState.isRecording,
    recorderState.metering,
  ]);

  async function ensureSentinelStarted() {
    if (
      startingRef.current ||
      processingRef.current ||
      recorderStateRef.current.isRecording
    ) {
      return;
    }

    startingRef.current = true;

    try {
      const permission = await requestVeraAudioRecordingPermission();

      if (!permission.granted || !enabledRef.current) {
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await startNextChunk();
    } catch {
      await stopSentinel();
    } finally {
      startingRef.current = false;
    }
  }

  async function startNextChunk() {
    if (!enabledRef.current || recorderStateRef.current.isRecording) {
      return;
    }

    chunkStartedAtRef.current = new Date().toISOString();
    meteringSamplesRef.current = [];
    await audioRecorder.prepareToRecordAsync(AUDIO_SENTINEL_RECORDING_OPTIONS);
    audioRecorder.record();
  }

  async function finishCurrentChunk() {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    const captureStartedAt =
      chunkStartedAtRef.current ?? new Date().toISOString();
    const captureEndedAt = new Date().toISOString();
    const chunkIndex = chunkIndexRef.current + 1;
    const signal = analyzeAudioSentinelMetering(meteringSamplesRef.current);

    chunkIndexRef.current = chunkIndex;
    meteringSamplesRef.current = [];
    chunkStartedAtRef.current = null;

    try {
      await audioRecorder.stop();

      const uri = audioRecorder.uri ?? recorderStateRef.current.url;

      if (!uri) {
        return;
      }

      const chunk: PendingAudioChunk = {
        captureEndedAt,
        captureStartedAt,
        chunkIndex,
        signal,
        uri,
      };

      if (signal.hasRelevantAudio) {
        await enqueueRelevantChunkWithPreRoll(chunk);
      } else if (postRollChunksRemainingRef.current > 0) {
        await enqueuePostRollChunk(chunk);
      } else {
        await rememberQuietChunk(chunk);
      }
    } catch {
      // Foreground monitoring should fail closed without disrupting the app.
    } finally {
      processingRef.current = false;

      if (enabledRef.current) {
        void startNextChunk();
      }
    }
  }

  async function enqueueRelevantChunkWithPreRoll(chunk: PendingAudioChunk) {
    const alertSessionId = activeAlertSessionIdRef.current;

    if (!alertSessionId) {
      await FileSystem.deleteAsync(chunk.uri, { idempotent: true });
      return;
    }

    const previousQuietChunk = previousQuietChunkRef.current;
    previousQuietChunkRef.current = null;

    if (previousQuietChunk) {
      await enqueueChunk(
        alertSessionId,
        {
          ...previousQuietChunk,
          signal: {
            ...previousQuietChunk.signal,
            confidence: Math.max(previousQuietChunk.signal.confidence, 0.2),
            triggerReasons: ['pre_roll_context'],
          },
        },
        'audio_sentinel_pre_roll',
      );
    }

    await enqueueChunk(alertSessionId, chunk, 'audio_sentinel');
    postRollChunksRemainingRef.current = 1;
    void flushEvidenceUploadQueue(alertSessionId).catch(() => undefined);
  }

  async function enqueuePostRollChunk(chunk: PendingAudioChunk) {
    const alertSessionId = activeAlertSessionIdRef.current;
    postRollChunksRemainingRef.current = Math.max(
      0,
      postRollChunksRemainingRef.current - 1,
    );

    if (!alertSessionId) {
      await FileSystem.deleteAsync(chunk.uri, { idempotent: true });
      return;
    }

    await enqueueChunk(
      alertSessionId,
      {
        ...chunk,
        signal: {
          ...chunk.signal,
          confidence: Math.max(chunk.signal.confidence, 0.2),
          triggerReasons: ['post_roll_context'],
        },
      },
      'audio_sentinel_post_roll',
    );
    void flushEvidenceUploadQueue(alertSessionId).catch(() => undefined);
  }

  async function rememberQuietChunk(chunk: PendingAudioChunk) {
    const previousQuietChunk = previousQuietChunkRef.current;
    const preRollUri = await copyChunkForPreRoll(chunk);

    previousQuietChunkRef.current = {
      ...chunk,
      uri: preRollUri,
    };
    await FileSystem.deleteAsync(chunk.uri, { idempotent: true });

    if (previousQuietChunk) {
      await FileSystem.deleteAsync(previousQuietChunk.uri, {
        idempotent: true,
      });
    }
  }

  async function enqueueChunk(
    alertSessionId: string,
    chunk: PendingAudioChunk,
    source: AudioSentinelChunkSource,
  ) {
    await enqueueEvidenceUpload({
      alertSessionId,
      fileName: `vera-audio-sentinel-${chunk.chunkIndex}.m4a`,
      metadata: buildAudioSentinelMetadata({
        captureEndedAt: chunk.captureEndedAt,
        captureStartedAt: chunk.captureStartedAt,
        chunkIndex: chunk.chunkIndex,
        postRollMs:
          source === 'audio_sentinel_post_roll'
            ? AUDIO_SENTINEL_POST_ROLL_MS
            : 0,
        preRollMs:
          source === 'audio_sentinel' || source === 'audio_sentinel_pre_roll'
            ? AUDIO_SENTINEL_PRE_ROLL_MS
            : 0,
        signal: chunk.signal,
        source,
      }),
      mimeType: 'audio/mp4',
      sourceUri: chunk.uri,
      type: 'AUDIO',
    });
    await FileSystem.deleteAsync(chunk.uri, { idempotent: true });
  }

  async function stopSentinel() {
    if (recorderStateRef.current.isRecording) {
      try {
        await audioRecorder.stop();
      } catch {
        // Recorder may already be stopped by the native layer.
      }
    }

    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    chunkStartedAtRef.current = null;
    meteringSamplesRef.current = [];
    postRollChunksRemainingRef.current = 0;

    const previousQuietChunk = previousQuietChunkRef.current;
    previousQuietChunkRef.current = null;

    if (previousQuietChunk) {
      await FileSystem.deleteAsync(previousQuietChunk.uri, {
        idempotent: true,
      });
    }
  }

  async function copyChunkForPreRoll(chunk: PendingAudioChunk) {
    const directory = getPreRollDirectory();
    const destination = `${directory}pre-roll-${chunk.chunkIndex}.m4a`;

    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.copyAsync({
      from: chunk.uri,
      to: destination,
    });

    return destination;
  }

  return <>{children}</>;
}

function getPreRollDirectory() {
  const baseDirectory =
    FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('Armazenamento local temporário indisponível.');
  }

  return `${baseDirectory}${AUDIO_SENTINEL_PRE_ROLL_DIR_NAME}`;
}
