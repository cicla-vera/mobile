const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile History Charts Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-history-charts-${Date.now()}@example.com`;
const FIRST_DATE = process.env.SMOKE_HISTORY_CHARTS_FIRST_DATE || '2026-05-04';
const SECOND_DATE =
  process.env.SMOKE_HISTORY_CHARTS_SECOND_DATE || '2026-05-11';
const THIRD_DATE = process.env.SMOKE_HISTORY_CHARTS_THIRD_DATE || '2026-05-18';

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

await Promise.all([
  request('/temperature', {
    method: 'POST',
    headers,
    body: JSON.stringify({ temperature: 36.4, date: FIRST_DATE }),
  }),
  request('/temperature', {
    method: 'POST',
    headers,
    body: JSON.stringify({ temperature: 36.9, date: SECOND_DATE }),
  }),
  request('/weight', {
    method: 'POST',
    headers,
    body: JSON.stringify({ weight: 65.3, date: FIRST_DATE }),
  }),
  request('/weight', {
    method: 'POST',
    headers,
    body: JSON.stringify({ weight: 64.8, date: SECOND_DATE }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'CALM', date: FIRST_DATE }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'ENERGETIC', date: SECOND_DATE }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'CALM', date: THIRD_DATE }),
  }),
]);

const [temperature, weight, moods] = await Promise.all([
  request('/temperature', { headers }),
  request('/weight', { headers }),
  request('/moods', { headers }),
]);

assertContains(
  'temperature',
  temperature,
  (entry) =>
    entry.temperature === 36.4 && entry.date?.slice(0, 10) === FIRST_DATE,
);
assertContains(
  'temperature',
  temperature,
  (entry) =>
    entry.temperature === 36.9 && entry.date?.slice(0, 10) === SECOND_DATE,
);
assertContains(
  'weight',
  weight,
  (entry) => entry.weight === 65.3 && entry.date?.slice(0, 10) === FIRST_DATE,
);
assertContains(
  'weight',
  weight,
  (entry) => entry.weight === 64.8 && entry.date?.slice(0, 10) === SECOND_DATE,
);
assertContains('moods', moods, (entry) => entry.mood === 'ENERGETIC');

const calmCount = moods.filter((entry) => entry.mood === 'CALM').length;

if (calmCount < 2) {
  throw new Error(`moods: expected at least 2 CALM entries, got ${calmCount}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      temperatureEntries: temperature.length,
      weightEntries: weight.length,
      moodEntries: moods.length,
      calmCount,
    },
    null,
    2,
  ),
);
