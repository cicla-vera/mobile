import { queryClient } from '@/services/query-client';
import {
  getDemoAlertTimeline,
  VERA_DEMO_ALERT_SESSION,
  VERA_DEMO_CONTACTS,
  VERA_DEMO_EVIDENCE,
  VERA_DEMO_LOCATIONS,
  VERA_DEMO_PROFILE,
  VERA_DEMO_SESSION,
} from '@/services/demo/vera-demo-data';
import { userProfileQueryKey } from '@/hooks/useUserProfile';
import { veraQueryKeys } from '@/hooks/vera';
import { useAuthStore } from '@/stores/auth.store';
import { useVeraStore } from '@/stores/vera.store';

export function startVeraDemoSession() {
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  useAuthStore.setState({
    isAuthenticated: true,
    isHydrated: true,
    token: VERA_DEMO_SESSION.token,
    user: VERA_DEMO_SESSION.user,
  });
  useVeraStore.setState({
    activeAlertSessionId: VERA_DEMO_ALERT_SESSION.id,
    isActiveAlertHydrated: true,
    isUnlocked: true,
    sessionExpiresAt: expiresAt,
    veraSessionToken: 'vera-demo-session-token',
  });

  queryClient.setQueryData(userProfileQueryKey, VERA_DEMO_SESSION.user);
  queryClient.setQueryData(veraQueryKeys.profile(), VERA_DEMO_PROFILE);
  queryClient.setQueryData(
    veraQueryKeys.emergencyContactsList(false),
    VERA_DEMO_CONTACTS,
  );
  queryClient.setQueryData(
    veraQueryKeys.safetyLocationsList(false),
    VERA_DEMO_LOCATIONS,
  );
  queryClient.setQueryData(
    veraQueryKeys.activeSafetyLocations(),
    VERA_DEMO_LOCATIONS.filter((location) => location.enabled),
  );
  queryClient.setQueryData(
    veraQueryKeys.activeAlertSession(),
    VERA_DEMO_ALERT_SESSION,
  );
  queryClient.setQueryData(
    veraQueryKeys.alertSession(VERA_DEMO_ALERT_SESSION.id),
    VERA_DEMO_ALERT_SESSION,
  );
  queryClient.setQueryData(
    veraQueryKeys.alertTimeline(VERA_DEMO_ALERT_SESSION.id),
    getDemoAlertTimeline(),
  );
  queryClient.setQueryData(
    veraQueryKeys.evidence(VERA_DEMO_ALERT_SESSION.id),
    VERA_DEMO_EVIDENCE,
  );
}
