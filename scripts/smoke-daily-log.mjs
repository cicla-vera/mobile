const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Daily Log Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-daily-log-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_DAILY_LOG_DATE || '2026-05-15';
const SYMPTOM_NAME = `Smoke symptom ${Date.now()}`;
const NOTE_CONTENT = `Daily log smoke note ${Date.now()}`;

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

function assertArrayContains(label, entries, predicate) {
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
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mood: 'CALM',
      date: DATE,
    }),
  }),
  request('/flow', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      intensity: 'MEDIUM',
      date: DATE,
    }),
  }),
  request('/symptoms', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      symptomName: SYMPTOM_NAME,
      intensity: 4,
      date: DATE,
    }),
  }),
  request('/notes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: NOTE_CONTENT,
      date: DATE,
    }),
  }),
]);

const [moods, flow, symptoms, notes, availableSymptoms] = await Promise.all([
  request(`/moods?date=${DATE}`, { headers }),
  request(`/flow?date=${DATE}`, { headers }),
  request(`/symptoms?date=${DATE}`, { headers }),
  request(`/notes?date=${DATE}`, { headers }),
  request('/symptoms/available', { headers }),
]);

assertArrayContains('moods', moods, (entry) => entry.mood === 'CALM');
assertArrayContains('flow', flow, (entry) => entry.intensity === 'MEDIUM');
assertArrayContains(
  'symptoms',
  symptoms,
  (entry) => entry.symptom?.name === SYMPTOM_NAME && entry.intensity === 4,
);
assertArrayContains('notes', notes, (entry) => entry.content === NOTE_CONTENT);
assertArrayContains(
  'available symptoms',
  availableSymptoms,
  (entry) => entry.name === SYMPTOM_NAME,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      date: DATE,
      moodEntries: moods.length,
      flowEntries: flow.length,
      symptomEntries: symptoms.length,
      noteEntries: notes.length,
    },
    null,
    2,
  ),
);
