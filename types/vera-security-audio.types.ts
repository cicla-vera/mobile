export type SecurityModeStatus =
  | 'idle'
  | 'starting'
  | 'recording'
  | 'post_trigger'
  | 'sealing'
  | 'stopping'
  | 'error';

export type SecurityAudioEvidence = {
  id: string;
  fileName: string;
  localUri: string;
  sha256: string;
  detectedText: string;
  triggeredAt: string;
  sealedAt: string;
  durationMillis: number;
  mimeType: string;
  uploadSimulatedAt: string | null;
  alertSessionId: string | null;
  fileSizeBytes: number;
};

export type SecurityModeSnapshot = {
  status: SecurityModeStatus;
  isActive: boolean;
  segmentStartedAt: string | null;
  postTriggerStartedAt: string | null;
  lastDetectedText: string | null;
  lastError: string | null;
  nextSimulatedTriggerAt: string | null;
  evidences: SecurityAudioEvidence[];
};

export type SecurityAudioCheckpoint = {
  isActive: boolean;
  nextSimulatedTriggerAt: string | null;
  pendingTriggerText: string | null;
  updatedAt: string;
};

export type SimulatedCloudUploadPayload = {
  evidenceId: string;
  sha256: string;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  detectedText: string;
  sealedAt: string;
  binaryPreviewBase64: string;
};
