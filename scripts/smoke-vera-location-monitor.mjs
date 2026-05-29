const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME =
  process.env.SMOKE_AUTH_NAME || 'Mobile Vera Location Monitor Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-vera-location-${Date.now()}@example.com`;
const SAMPLE_LOCATION = {
  latitude: -3.731862,
  longitude: -38.526669,
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${path} failed with ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}

async function register() {
  if (process.env.SMOKE_AUTH_EMAIL) {
    return null;
  }

  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
    }),
  });
}

async function login() {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

await register();
const session = await login();

if (!session?.token) {
  throw new Error('login: missing token');
}

const headers = authHeaders(session.token);

const profile = await request('/vera/profile', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    consentAccepted: true,
    monitoringEnabled: true,
    veraEnabled: true,
  }),
});

expectEqual('monitoring enabled', profile.monitoringEnabled, true);

const safetyLocation = await request('/vera/safety-locations', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'Casa monitorada',
    latitude: SAMPLE_LOCATION.latitude,
    longitude: SAMPLE_LOCATION.longitude,
    radiusMeters: 150,
    type: 'RISK',
  }),
});

const activeLocations = await request('/vera/safety-locations/active', {
  headers,
});

if (!activeLocations.some((location) => location.id === safetyLocation.id)) {
  throw new Error('active locations: expected created risk location');
}

const alertSession = await request('/vera/alert-sessions/location', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    currentLatitude: SAMPLE_LOCATION.latitude,
    currentLongitude: SAMPLE_LOCATION.longitude,
    message: 'Smoke test location match',
    safetyLocationId: safetyLocation.id,
  }),
});

expectEqual('alert trigger', alertSession.trigger, 'LOCATION');
expectEqual('alert status', alertSession.status, 'ACTIVE');
expectEqual(
  'safety location id',
  alertSession.safetyLocationId,
  safetyLocation.id,
);

const activeAlert = await request('/vera/alert-sessions/active', { headers });

expectEqual('active alert id', activeAlert.id, alertSession.id);

const capturedAt = new Date().toISOString();
const locationSamplesResponse = await request(
  `/vera/alert-sessions/${alertSession.id}/location-samples`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accuracyMeters: 18,
      capturedAt,
      latitude: SAMPLE_LOCATION.latitude,
      longitude: SAMPLE_LOCATION.longitude,
      source: 'FOREGROUND',
    }),
  },
);
const [locationSample] = locationSamplesResponse.samples ?? [];

if (!locationSample?.id) {
  throw new Error('location sample: expected persisted sample');
}

const locationSamples = await request(
  `/vera/alert-sessions/${alertSession.id}/location-samples?limit=10`,
  { headers },
);

if (!locationSamples.some((sample) => sample.id === locationSample.id)) {
  throw new Error('location samples list: expected persisted sample');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      activeAlertSessionId: activeAlert.id,
      apiUrl: API_URL,
      email: EMAIL,
      locationSampleId: locationSample.id,
      safetyLocationId: safetyLocation.id,
    },
    null,
    2,
  ),
);
