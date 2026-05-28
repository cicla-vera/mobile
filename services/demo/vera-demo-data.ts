import type { AuthSession, UserProfile } from '@/types/api.types';
import type {
  AlertEvent,
  AlertSession,
  AlertTimeline,
  EmergencyContact,
  EmergencyDispatchResponse,
  EvidenceAnalysis,
  EvidenceRecord,
  EvidenceVerification,
  SafetyLocation,
  SafetyProfile,
} from '@/types/vera.types';

const now = new Date('2026-05-26T03:00:00.000Z');
const sessionStart = new Date(now.getTime() - 42 * 60 * 1000).toISOString();

export const VERA_DEMO_USER: UserProfile = {
  id: 'demo-user-vera',
  email: 'demo@ciclavera.local',
  name: 'Lia Demo',
};

export const VERA_DEMO_SESSION: AuthSession = {
  token: 'vera-demo-token',
  user: VERA_DEMO_USER,
};

export const VERA_DEMO_PROFILE: SafetyProfile = {
  id: 'demo-safety-profile',
  userId: VERA_DEMO_USER.id,
  veraEnabled: true,
  consentAccepted: true,
  consentAcceptedAt: '2026-05-20T10:00:00.000Z',
  pinConfigured: true,
  pinUpdatedAt: '2026-05-20T10:05:00.000Z',
  biometricUnlockEnabled: true,
  discreetNotificationsEnabled: true,
  monitoringEnabled: true,
  createdAt: '2026-05-20T10:00:00.000Z',
  updatedAt: now.toISOString(),
};

export const VERA_DEMO_CONTACTS: EmergencyContact[] = [
  {
    id: 'demo-contact-1',
    userId: VERA_DEMO_USER.id,
    name: 'Marina',
    phone: '+5585999990001',
    relationship: 'Irma',
    priority: 1,
    enabled: true,
    createdAt: '2026-05-20T10:10:00.000Z',
    updatedAt: '2026-05-20T10:10:00.000Z',
  },
  {
    id: 'demo-contact-2',
    userId: VERA_DEMO_USER.id,
    name: 'Casa de apoio',
    phone: '+5585999990002',
    relationship: 'Rede segura',
    priority: 2,
    enabled: true,
    createdAt: '2026-05-20T10:11:00.000Z',
    updatedAt: '2026-05-20T10:11:00.000Z',
  },
];

export const VERA_DEMO_LOCATIONS: SafetyLocation[] = [
  {
    id: 'demo-location-risk',
    userId: VERA_DEMO_USER.id,
    name: 'Apartamento monitorado',
    latitude: -3.731862,
    longitude: -38.526669,
    radiusMeters: 180,
    type: 'RISK',
    enabled: true,
    createdAt: '2026-05-20T10:20:00.000Z',
    updatedAt: '2026-05-20T10:20:00.000Z',
  },
  {
    id: 'demo-location-trusted',
    userId: VERA_DEMO_USER.id,
    name: 'Casa da Marina',
    latitude: -3.727201,
    longitude: -38.521454,
    radiusMeters: 120,
    type: 'TRUSTED',
    enabled: true,
    createdAt: '2026-05-20T10:21:00.000Z',
    updatedAt: '2026-05-20T10:21:00.000Z',
  },
];

export const VERA_DEMO_ALERT_SESSION: AlertSession = {
  id: 'demo-alert-session',
  userId: VERA_DEMO_USER.id,
  safetyLocationId: VERA_DEMO_LOCATIONS[0].id,
  trigger: 'LOCATION',
  status: 'ACTIVE',
  level: 'CRITICAL',
  startedAt: sessionStart,
  endedAt: null,
  criticalEscalatedAt: new Date(
    new Date(sessionStart).getTime() + 14 * 60 * 1000,
  ).toISOString(),
  initialLatitude: VERA_DEMO_LOCATIONS[0].latitude,
  initialLongitude: VERA_DEMO_LOCATIONS[0].longitude,
  createdAt: sessionStart,
  updatedAt: now.toISOString(),
  events: [],
  alreadyActive: true,
};

export const VERA_DEMO_EVIDENCE: EvidenceRecord[] = [
  {
    id: 'demo-evidence-audio',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'AUDIO',
    size: 884224,
    mimeType: 'audio/mp4',
    originalName: 'ambiente-sala.m4a',
    contentHash:
      '8f14e45fceea167a5a36dedd4bea2543f6c9f09f6f4b9b4f9a5a9a8e1a0f8c11',
    hashAlgorithm: 'SHA-256',
    hashedAt: new Date(
      new Date(sessionStart).getTime() + 9 * 60 * 1000,
    ).toISOString(),
    hiddenFromUserAt: null,
    retentionUntil: null,
    deletedAt: null,
    metadata: {
      source: 'demo',
      durationSeconds: 38,
    },
    createdAt: new Date(
      new Date(sessionStart).getTime() + 9 * 60 * 1000,
    ).toISOString(),
  },
  {
    id: 'demo-evidence-image',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'IMAGE',
    size: 422112,
    mimeType: 'image/jpeg',
    originalName: 'registro-porta.jpg',
    contentHash:
      '4b825dc642cb6eb9a060e54bf8d69288fbee4904f4a2460f942edc908e44f9ad',
    hashAlgorithm: 'SHA-256',
    hashedAt: new Date(
      new Date(sessionStart).getTime() + 17 * 60 * 1000,
    ).toISOString(),
    hiddenFromUserAt: null,
    retentionUntil: null,
    deletedAt: null,
    metadata: {
      source: 'demo',
      capturedBy: 'camera_photo',
    },
    createdAt: new Date(
      new Date(sessionStart).getTime() + 17 * 60 * 1000,
    ).toISOString(),
  },
];

export const VERA_DEMO_ANALYSIS: EvidenceAnalysis = {
  id: 'demo-analysis-audio',
  evidenceRecordId: VERA_DEMO_EVIDENCE[0].id,
  alertSessionId: VERA_DEMO_ALERT_SESSION.id,
  status: 'COMPLETED',
  riskLevel: 'HIGH',
  suggestedAlertLevel: 'CRITICAL',
  confidence: 0.82,
  summary:
    'A leitura de apoio encontrou fala elevada, pedido de afastamento e ' +
    'ruido brusco no trecho enviado.',
  detectedSignals: {
    raisedVoice: true,
    threatTerms: ['ameaca verbal'],
    impactNoise: true,
    distressLanguage: true,
  },
  shouldEscalate: true,
  failureReason: null,
  createdAt: new Date(
    new Date(sessionStart).getTime() + 18 * 60 * 1000,
  ).toISOString(),
};

export const VERA_DEMO_EVENTS: AlertEvent[] = [
  {
    id: 'demo-event-started',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'SESSION_STARTED',
    message: 'Sessão demo iniciada por entrada em local monitorado.',
    metadata: { demo: true },
    latitude: VERA_DEMO_LOCATIONS[0].latitude,
    longitude: VERA_DEMO_LOCATIONS[0].longitude,
    createdAt: sessionStart,
  },
  {
    id: 'demo-event-location',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'LOCATION_ENTERED',
    message: 'Local monitorado detectado.',
    metadata: { safetyLocationId: VERA_DEMO_LOCATIONS[0].id },
    latitude: VERA_DEMO_LOCATIONS[0].latitude,
    longitude: VERA_DEMO_LOCATIONS[0].longitude,
    createdAt: new Date(
      new Date(sessionStart).getTime() + 2 * 60 * 1000,
    ).toISOString(),
  },
  {
    id: 'demo-event-evidence',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'EVIDENCE_UPLOADED',
    message: 'Evidência demo adicionada ao cofre.',
    metadata: { evidenceRecordId: VERA_DEMO_EVIDENCE[0].id },
    latitude: null,
    longitude: null,
    createdAt: VERA_DEMO_EVIDENCE[0].createdAt,
  },
  {
    id: 'demo-event-analysis',
    userId: VERA_DEMO_USER.id,
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    type: 'AI_ANALYSIS_COMPLETED',
    message: 'Análise IA demo concluída.',
    metadata: {
      evidenceAnalysisId: VERA_DEMO_ANALYSIS.id,
      evidenceRecordId: VERA_DEMO_ANALYSIS.evidenceRecordId,
      status: VERA_DEMO_ANALYSIS.status,
    },
    latitude: null,
    longitude: null,
    createdAt: VERA_DEMO_ANALYSIS.createdAt,
  },
];

export function getDemoAlertTimeline(): AlertTimeline {
  return {
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    level: VERA_DEMO_ALERT_SESSION.level,
    status: VERA_DEMO_ALERT_SESSION.status,
    events: VERA_DEMO_EVENTS,
  };
}

export function getDemoDispatchResponse(): EmergencyDispatchResponse {
  return {
    alertSessionId: VERA_DEMO_ALERT_SESSION.id,
    level: 'CRITICAL',
    providerConfigured: true,
    attempts: VERA_DEMO_CONTACTS.map((contact) => ({
      contactId: contact.id,
      contactName: contact.name,
      priority: contact.priority,
      maskedPhone: '+55 ******' + contact.phone.slice(-4),
      status: 'sent',
      eventType: 'CONTACT_NOTIFIED',
      provider: 'demo',
      providerMessageId: `demo-${contact.id}`,
      message:
        'Mensagem demo enviada com orientacao para acionar ajuda no local.',
    })),
  };
}
