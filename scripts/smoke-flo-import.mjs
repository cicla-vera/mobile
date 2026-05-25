const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Flo Import Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL || `mobile-flo-import-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_FLO_IMPORT_DATE || '2026-05-21';

const payload = {
  cycles: [
    {
      startDate: DATE,
      endDate: '2026-05-25',
    },
  ],
  flowEntries: [
    {
      date: DATE,
      intensity: 'medium',
    },
  ],
  moods: [
    {
      date: DATE,
      mood: 'calm',
    },
  ],
  notes: [
    {
      date: DATE,
      content: 'Imported from mobile smoke test.',
    },
  ],
  temperatureEntries: [
    {
      date: DATE,
      temperature: 36.6,
    },
  ],
  weightEntries: [
    {
      date: DATE,
      weight: 65.2,
    },
  ],
  waterEntries: [
    {
      date: DATE,
      amount: 250,
    },
  ],
  sleepEntries: [
    {
      date: DATE,
      hours: 7.5,
      quality: 'good',
    },
  ],
  medications: [
    {
      date: DATE,
      name: 'Vitamina D',
      dose: '1000 UI',
    },
  ],
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

const result = await request('/import/flo', {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
});

expectEqual('source', result.source, 'flo');
expectEqual('cycles', result.imported.cycles, 1);
expectEqual('flow entries', result.imported.flowEntries, 1);
expectEqual('mood entries', result.imported.moodEntries, 1);
expectEqual('notes', result.imported.notes, 1);
expectEqual('temperature entries', result.imported.temperatureEntries, 1);
expectEqual('weight entries', result.imported.weightEntries, 1);
expectEqual('water entries', result.imported.waterEntries, 1);
expectEqual('sleep entries', result.imported.sleepEntries, 1);
expectEqual('medication entries', result.imported.medicationEntries, 1);

const history = await request('/cycles/history', { headers });

if (!Array.isArray(history.cycles) || history.cycles.length === 0) {
  throw new Error('cycle history: expected imported cycle');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      source: result.source,
      processedRecords: result.processedRecords,
      imported: result.imported,
    },
    null,
    2,
  ),
);
