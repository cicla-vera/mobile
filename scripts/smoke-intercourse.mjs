const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Intercourse Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-intercourse-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_INTERCOURSE_DATE || '2026-05-19';
const IS_PROTECTED = process.env.SMOKE_INTERCOURSE_PROTECTED !== 'false';

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

const created = await request('/intercourse', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    protected: IS_PROTECTED,
    date: DATE,
  }),
});

if (!created?.id) {
  throw new Error('intercourse create: missing id');
}

expectEqual('intercourse create protected', created.protected, IS_PROTECTED);

const dayEntries = await request(`/intercourse?date=${DATE}`, { headers });

assertContains(
  'intercourse by date',
  dayEntries,
  (entry) => entry.id === created.id && entry.protected === IS_PROTECTED,
);

const allEntries = await request('/intercourse', { headers });

assertContains(
  'intercourse list',
  allEntries,
  (entry) => entry.id === created.id,
);

const deleted = await request(`/intercourse/${created.id}`, {
  method: 'DELETE',
  headers,
});

expectEqual('intercourse delete count', deleted.count, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      date: DATE,
      protected: IS_PROTECTED,
      deleted: deleted.count,
    },
    null,
    2,
  ),
);
