export const veraQueryKeys = {
  all: ['vera'] as const,
  profile: () => [...veraQueryKeys.all, 'profile'] as const,
  emergencyContacts: () =>
    [...veraQueryKeys.all, 'emergency-contacts'] as const,
  emergencyContactsList: (includeDisabled = false) =>
    [
      ...veraQueryKeys.emergencyContacts(),
      'list',
      { includeDisabled },
    ] as const,
  emergencyContact: (id: string) =>
    [...veraQueryKeys.emergencyContacts(), 'detail', id] as const,
  safetyLocations: () => [...veraQueryKeys.all, 'safety-locations'] as const,
  safetyLocationsList: (includeDisabled = false) =>
    [
      ...veraQueryKeys.safetyLocations(),
      'list',
      { includeDisabled },
    ] as const,
  activeSafetyLocations: () =>
    [...veraQueryKeys.safetyLocations(), 'active'] as const,
  safetyLocation: (id: string) =>
    [...veraQueryKeys.safetyLocations(), 'detail', id] as const,
  alertSessions: () => [...veraQueryKeys.all, 'alert-sessions'] as const,
  activeAlertSession: () =>
    [...veraQueryKeys.alertSessions(), 'active'] as const,
  alertSession: (id: string) =>
    [...veraQueryKeys.alertSessions(), 'detail', id] as const,
  alertTimeline: (alertSessionId: string) =>
    [...veraQueryKeys.alertSessions(), alertSessionId, 'timeline'] as const,
  evidence: (alertSessionId: string) =>
    [...veraQueryKeys.alertSessions(), alertSessionId, 'evidence'] as const,
  evidenceAnalysis: (evidenceRecordId: string) =>
    [
      ...veraQueryKeys.alertSessions(),
      'evidence-analysis',
      evidenceRecordId,
    ] as const,
  evidenceUploadQueue: (alertSessionId: string) =>
    [
      ...veraQueryKeys.alertSessions(),
      alertSessionId,
      'evidence-upload-queue',
    ] as const,
};
