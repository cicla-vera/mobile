const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Medications Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-medications-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_MEDICATION_DATE || '2026-05-20';
const MEDICATION_NAME = process.env.SMOKE_MEDICATION_NAME || 'Vitamina D';
const DOSE = process.env.SMOKE_MEDICATION_DOSE || '1000 UI';

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

const created = await request('/medications', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: MEDICATION_NAME,
    dose: DOSE,
    date: DATE,
  }),
});

if (!created?.id) {
  throw new Error('medications create: missing id');
}

expectEqual('medications create name', created.name, MEDICATION_NAME);
expectEqual('medications create dose', created.dose, DOSE);

const dayEntries = await request(`/medications?date=${DATE}`, { headers });

assertContains(
  'medications by date',
  dayEntries,
  (entry) =>
    entry.id === created.id &&
    entry.name === MEDICATION_NAME &&
    entry.dose === DOSE,
);

const allEntries = await request('/medications', { headers });

assertContains(
  'medications list',
  allEntries,
  (entry) => entry.id === created.id,
);

const deleted = await request(`/medications/${created.id}`, {
  method: 'DELETE',
  headers,
});

expectEqual('medications delete count', deleted.count, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      date: DATE,
      name: MEDICATION_NAME,
      dose: DOSE,
      deleted: deleted.count,
    },
    null,
    2,
  ),
);
