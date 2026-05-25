export type VeraDateTime = string;

export type VeraMetadataValue = string | number | boolean | null;

export type VeraMetadata = Record<string, VeraMetadataValue>;

export type SafetyLocationType = 'TRUSTED' | 'RISK';

export type AlertTrigger = 'MANUAL' | 'LOCATION';

export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED';

export type AlertLevel = 'NORMAL' | 'CRITICAL';

export type AlertEventType =
  | 'SESSION_STARTED'
  | 'LOCATION_ENTERED'
  | 'EVIDENCE_UPLOADED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'ALERT_ESCALATED'
  | 'CONTACT_NOTIFIED'
  | 'CONTACT_NOTIFICATION_FAILED'
  | 'SESSION_CLOSED';

export type EvidenceType = 'AUDIO' | 'VIDEO' | 'IMAGE' | 'FILE';

export type EvidenceAuditAction =
  | 'UPLOADED'
  | 'HASH_VERIFIED'
  | 'HIDDEN_FROM_USER';

export type EvidenceAnalysisStatus = 'COMPLETED' | 'FAILED';

export type SafetyProfile = {
  id: string;
  userId: string;
  veraEnabled: boolean;
  consentAccepted: boolean;
  consentAcceptedAt: VeraDateTime | null;
  pinConfigured: boolean;
  pinUpdatedAt: VeraDateTime | null;
  biometricUnlockEnabled: boolean;
  discreetNotificationsEnabled: boolean;
  monitoringEnabled: boolean;
  createdAt: VeraDateTime;
  updatedAt: VeraDateTime;
};

export type UpdateSafetyProfileRequest = Partial<
  Pick<
    SafetyProfile,
    | 'veraEnabled'
    | 'consentAccepted'
    | 'biometricUnlockEnabled'
    | 'discreetNotificationsEnabled'
    | 'monitoringEnabled'
  >
>;

export type SetVeraPinRequest = {
  pin: string;
  currentPin?: string;
};

export type VerifyVeraPinRequest = {
  pin: string;
};

export type VeraPinStatus = {
  pinConfigured: boolean;
  pinUpdatedAt: VeraDateTime | null;
};

export type VerifyVeraPinResponse = VeraPinStatus & {
  verified: true;
  veraSessionToken: string;
  expiresAt: VeraDateTime;
};

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string | null;
  priority: number;
  enabled: boolean;
  createdAt: VeraDateTime;
  updatedAt: VeraDateTime;
};

export type CreateEmergencyContactRequest = {
  name: string;
  phone: string;
  relationship?: string;
  priority?: number;
};

export type UpdateEmergencyContactRequest = Partial<
  CreateEmergencyContactRequest & {
    enabled: boolean;
  }
>;

export type SafetyLocation = {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: SafetyLocationType;
  enabled: boolean;
  createdAt: VeraDateTime;
  updatedAt: VeraDateTime;
};

export type CreateSafetyLocationRequest = {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type?: SafetyLocationType;
};

export type UpdateSafetyLocationRequest = Partial<
  CreateSafetyLocationRequest & {
    enabled: boolean;
  }
>;

export type AlertEvent = {
  id: string;
  userId: string;
  alertSessionId: string;
  type: AlertEventType;
  message: string | null;
  metadata: VeraMetadata | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: VeraDateTime;
};

export type AlertSession = {
  id: string;
  userId: string;
  safetyLocationId: string | null;
  trigger: AlertTrigger;
  status: AlertStatus;
  level: AlertLevel;
  startedAt: VeraDateTime;
  endedAt: VeraDateTime | null;
  criticalEscalatedAt: VeraDateTime | null;
  initialLatitude: number | null;
  initialLongitude: number | null;
  createdAt: VeraDateTime;
  updatedAt: VeraDateTime;
  events: AlertEvent[];
  alreadyActive: boolean;
};

export type StartManualAlertSessionRequest = {
  initialLatitude?: number;
  initialLongitude?: number;
  message?: string;
};

export type StartLocationAlertSessionRequest = {
  safetyLocationId: string;
  currentLatitude: number;
  currentLongitude: number;
  message?: string;
};

export type CloseAlertSessionRequest = {
  status: Exclude<AlertStatus, 'ACTIVE'>;
  message?: string;
};

export type CreateAlertEventRequest = {
  type: AlertEventType;
  message?: string;
  metadata?: VeraMetadata;
  latitude?: number;
  longitude?: number;
};

export type AlertTimeline = {
  alertSessionId: string;
  status: AlertStatus;
  level: AlertLevel;
  events: AlertEvent[];
};

export type EvidenceRecord = {
  id: string;
  userId: string;
  alertSessionId: string;
  type: EvidenceType;
  size: number;
  mimeType: string;
  originalName: string | null;
  contentHash: string;
  hashAlgorithm: string;
  hashedAt: VeraDateTime;
  hiddenFromUserAt: VeraDateTime | null;
  retentionUntil: VeraDateTime | null;
  deletedAt: VeraDateTime | null;
  metadata: VeraMetadata | null;
  createdAt: VeraDateTime;
};

export type EvidenceVerification = {
  evidenceRecordId: string;
  hashAlgorithm: string;
  storedHash: string;
  calculatedHash: string;
  matches: boolean;
  checkedAt: VeraDateTime;
};

export type EvidenceAnalysis = {
  id: string;
  evidenceRecordId: string;
  alertSessionId: string;
  status: EvidenceAnalysisStatus;
  riskLevel: string | null;
  suggestedAlertLevel: AlertLevel | null;
  confidence: number | null;
  summary: string | null;
  detectedSignals: unknown;
  shouldEscalate: boolean | null;
  failureReason: string | null;
  createdAt: VeraDateTime;
};

export type VeraEvidenceUploadFile =
  | Blob
  | {
      uri: string;
      name: string;
      type: string;
    };

export type UploadEvidenceRequest = {
  type: EvidenceType;
  file: VeraEvidenceUploadFile;
  metadata?: VeraMetadata;
};
