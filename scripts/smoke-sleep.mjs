const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Sleep Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL || `mobile-sleep-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_SLEEP_DATE || '2026-05-18';
const HOURS = Number(process.env.SMOKE_SLEEP_HOURS || 7.5);
const QUALITY = process.env.SMOKE_SLEEP_QUALITY || 'GOOD';

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

const created = await request('/sleep', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    hours: HOURS,
    quality: QUALITY,
    date: DATE,
  }),
});

if (!created?.id) {
  throw new Error('sleep create: missing id');
}

expectEqual('sleep create hours', created.hours, HOURS);
expectEqual('sleep create quality', created.quality, QUALITY);

const dayEntries = await request(`/sleep?date=${DATE}`, { headers });

assertContains(
  'sleep by date',
  dayEntries,
  (entry) => entry.id === created.id && entry.hours === HOURS,
);

const allEntries = await request('/sleep', { headers });

assertContains('sleep list', allEntries, (entry) => entry.id === created.id);

const deleted = await request(`/sleep/${created.id}`, {
  method: 'DELETE',
  headers,
});

expectEqual('sleep delete count', deleted.count, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      date: DATE,
      hours: HOURS,
      quality: QUALITY,
      deleted: deleted.count,
    },
    null,
    2,
  ),
);
