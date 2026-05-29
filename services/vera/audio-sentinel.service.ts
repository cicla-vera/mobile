import { Platform } from 'react-native';

import type { VeraMetadata } from '@/types/vera.types';

export type AudioSentinelChunkSignal = {
  confidence: number;
  hasRelevantAudio: boolean;
  loudSampleRatio: number;
  maxMetering: number | null;
  meanMetering: number | null;
  sampleCount: number;
  triggerReasons: string[];
};

export type AudioSentinelChunkSource =
  | 'audio_sentinel'
  | 'audio_sentinel_pre_roll'
  | 'audio_sentinel_post_roll';

export type AudioSentinelChunkMetadataInput = {
  captureEndedAt: string;
  captureStartedAt: string;
  chunkIndex: number;
  postRollMs?: number;
  preRollMs?: number;
  signal: AudioSentinelChunkSignal;
  source: AudioSentinelChunkSource;
};

export const AUDIO_SENTINEL_CHUNK_MS = 8000;
export const AUDIO_SENTINEL_PRE_ROLL_MS = 8000;
export const AUDIO_SENTINEL_POST_ROLL_MS = 8000;
export const AUDIO_SENTINEL_MIN_SAMPLES = 4;
export const AUDIO_SENTINEL_LOUD_DB = -32;
export const AUDIO_SENTINEL_VERY_LOUD_DB = -20;
export const AUDIO_SENTINEL_LOUD_RATIO = 0.22;

export function analyzeAudioSentinelMetering(
  samples: number[],
): AudioSentinelChunkSignal {
  const usableSamples = samples.filter(Number.isFinite);

  if (usableSamples.length < AUDIO_SENTINEL_MIN_SAMPLES) {
    return {
      confidence: 0,
      hasRelevantAudio: false,
      loudSampleRatio: 0,
      maxMetering: null,
      meanMetering: null,
      sampleCount: usableSamples.length,
      triggerReasons: ['metering_insufficient'],
    };
  }

  const maxMetering = Math.max(...usableSamples);
  const meanMetering =
    usableSamples.reduce((total, sample) => total + sample, 0) /
    usableSamples.length;
  const loudSampleRatio =
    usableSamples.filter((sample) => sample >= AUDIO_SENTINEL_LOUD_DB).length /
    usableSamples.length;
  const triggerReasons = getTriggerReasons(maxMetering, loudSampleRatio);
  const hasRelevantAudio = triggerReasons.length > 0;

  return {
    confidence: hasRelevantAudio
      ? getSignalConfidence(maxMetering, loudSampleRatio)
      : 0.12,
    hasRelevantAudio,
    loudSampleRatio: round(loudSampleRatio, 3),
    maxMetering: round(maxMetering, 2),
    meanMetering: round(meanMetering, 2),
    sampleCount: usableSamples.length,
    triggerReasons: hasRelevantAudio ? triggerReasons : ['ambient_audio'],
  };
}

export function buildAudioSentinelMetadata(
  input: AudioSentinelChunkMetadataInput,
): VeraMetadata {
  return {
    audioChunkIndex: input.chunkIndex,
    audioLoudSampleRatio: input.signal.loudSampleRatio,
    audioMaxMeteringDb: input.signal.maxMetering,
    audioMeanMeteringDb: input.signal.meanMetering,
    audioSentinelConfidence: input.signal.confidence,
    audioSentinelSampleCount: input.signal.sampleCount,
    captureEndedAt: input.captureEndedAt,
    captureStartedAt: input.captureStartedAt,
    foreground: true,
    platform: Platform.OS,
    postRollMs: input.postRollMs ?? 0,
    preRollMs: input.preRollMs ?? 0,
    source: input.source,
    triggeredAt: input.captureEndedAt,
    triggerReasons: input.signal.triggerReasons.join(','),
  };
}

function getTriggerReasons(maxMetering: number, loudSampleRatio: number) {
  const reasons: string[] = [];

  if (maxMetering >= AUDIO_SENTINEL_VERY_LOUD_DB) {
    reasons.push('very_loud_audio');
  }

  if (loudSampleRatio >= AUDIO_SENTINEL_LOUD_RATIO) {
    reasons.push('sustained_loud_audio');
  }

  if (maxMetering >= AUDIO_SENTINEL_LOUD_DB) {
    reasons.push('volume_spike');
  }

  return reasons;
}

function getSignalConfidence(maxMetering: number, loudSampleRatio: number) {
  const peakScore = Math.max(
    0,
    Math.min(1, (maxMetering - AUDIO_SENTINEL_LOUD_DB) / 24),
  );
  const ratioScore = Math.max(
    0,
    Math.min(1, loudSampleRatio / AUDIO_SENTINEL_LOUD_RATIO),
  );

  return round(Math.max(0.35, Math.min(0.95, (peakScore + ratioScore) / 2)), 3);
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}
