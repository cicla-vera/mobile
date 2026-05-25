const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Activity Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-activity-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_ACTIVITY_DATE || '2026-05-17';
const TYPE = process.env.SMOKE_ACTIVITY_TYPE || 'WALKING';
const INTENSITY = process.env.SMOKE_ACTIVITY_INTENSITY || 'LOW';
const DURATION = Number(process.env.SMOKE_ACTIVITY_DURATION || 30);

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

function assertContains(label, entries, predicate) {
  if (!Array.isArray(entries) || !entries.some(predicate)) {
    throw new Error(`${label}: expected entry was not returned`);
  }
}

await register();
const session = await login();

if (!session?.token) {
  throw new Error('login: missing token');
}

const headers = authHeaders(session.token);

const created = await request('/activity', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    type: TYPE,
    intensity: INTENSITY,
    duration: DURATION,
    date: DATE,
  }),
});

if (!created?.id) {
  throw new Error('activity create: missing id');
}

expectEqual('activity create type', created.type, TYPE);
expectEqual('activity create intensity', created.intensity, INTENSITY);
expectEqual('activity create duration', created.duration, DURATION);

const dayEntries = await request(`/activity?date=${DATE}`, { headers });

assertContains(
  'activity by date',
  dayEntries,
  (entry) => entry.id === created.id && entry.duration === DURATION,
);

const allEntries = await request('/activity', { headers });

assertContains('activity list', allEntries, (entry) => entry.id === created.id);

const deleted = await request(`/activity/${created.id}`, {
  method: 'DELETE',
  headers,
});

expectEqual('activity delete count', deleted.count, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      date: DATE,
      type: TYPE,
      intensity: INTENSITY,
      duration: DURATION,
      deleted: deleted.count,
    },
    null,
    2,
  ),
);
