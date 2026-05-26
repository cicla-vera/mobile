const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Monthly Summary Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-monthly-summary-${Date.now()}@example.com`;
const MONTH = process.env.SMOKE_MONTHLY_SUMMARY_MONTH || '2026-05';
const START_DATE = `${MONTH}-04`;
const END_DATE = `${MONTH}-08`;
const FIRST_DATE = `${MONTH}-06`;
const SECOND_DATE = `${MONTH}-07`;
const THIRD_DATE = `${MONTH}-08`;
const SYMPTOM_NAME = `Smoke monthly symptom ${Date.now()}`;
const MEDICATION_NAME = `Smoke monthly medication ${Date.now()}`;

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

function expectCount(items, value, expectedCount) {
  const item = items.find((entry) => entry.value === value);

  expectEqual(`${value} count`, item?.count, expectedCount);
}

function expectSymptomCount(items, name, expectedCount) {
  const item = items.find((entry) => entry.name === name);

  expectEqual(`${name} count`, item?.count, expectedCount);
}

await register();
const session = await login();

if (!session?.token) {
  throw new Error('login: missing token');
}

const headers = authHeaders(session.token);

await Promise.all([
  request('/cycles', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      startDate: START_DATE,
      endDate: END_DATE,
    }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'CALM', date: FIRST_DATE }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'CALM', date: SECOND_DATE }),
  }),
  request('/moods', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood: 'TIRED', date: THIRD_DATE }),
  }),
  request('/flow', {
    method: 'POST',
    headers,
    body: JSON.stringify({ intensity: 'MEDIUM', date: FIRST_DATE }),
  }),
  request('/flow', {
    method: 'POST',
    headers,
    body: JSON.stringify({ intensity: 'HEAVY', date: SECOND_DATE }),
  }),
  request('/notes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: `Monthly summary smoke note ${Date.now()}`,
      date: FIRST_DATE,
    }),
  }),
  request('/temperature', {
    method: 'POST',
    headers,
    body: JSON.stringify({ temperature: 36.5, date: FIRST_DATE }),
  }),
  request('/temperature', {
    method: 'POST',
    headers,
    body: JSON.stringify({ temperature: 37.1, date: SECOND_DATE }),
  }),
  request('/weight', {
    method: 'POST',
    headers,
    body: JSON.stringify({ weight: 65.5, date: FIRST_DATE }),
  }),
  request('/water', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 250, date: FIRST_DATE }),
  }),
  request('/water', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 500, date: SECOND_DATE }),
  }),
  request('/activity', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'WALKING',
      intensity: 'LOW',
      duration: 30,
      date: FIRST_DATE,
    }),
  }),
  request('/activity', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'YOGA',
      intensity: 'MEDIUM',
      duration: 45,
      date: SECOND_DATE,
    }),
  }),
  request('/sleep', {
    method: 'POST',
    headers,
    body: JSON.stringify({ hours: 7.5, quality: 'GOOD', date: FIRST_DATE }),
  }),
  request('/sleep', {
    method: 'POST',
    headers,
    body: JSON.stringify({ hours: 6.5, quality: 'FAIR', date: SECOND_DATE }),
  }),
  request('/intercourse', {
    method: 'POST',
    headers,
    body: JSON.stringify({ protected: true, date: FIRST_DATE }),
  }),
  request('/intercourse', {
    method: 'POST',
    headers,
    body: JSON.stringify({ protected: false, date: SECOND_DATE }),
  }),
  request('/medications', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: MEDICATION_NAME,
      dose: '1 tablet',
      date: FIRST_DATE,
    }),
  }),
]);

await request('/symptoms', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    symptomName: SYMPTOM_NAME,
    intensity: 4,
    date: FIRST_DATE,
  }),
});

await request('/symptoms', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    symptomName: SYMPTOM_NAME,
    intensity: 3,
    date: SECOND_DATE,
  }),
});

const summary = await request(`/cycles/summary/${MONTH}`, { headers });

expectEqual('month', summary.month, MONTH);
expectEqual('cycles.total', summary.cycles?.total, 1);
expectEqual('cycles.periodDays', summary.cycles?.periodDays, 4);
expectEqual('cycles.entries.length', summary.cycles?.entries?.length, 1);
expectEqual('moods.totalEntries', summary.moods?.totalEntries, 3);
expectCount(summary.moods.distribution, 'CALM', 2);
expectCount(summary.moods.distribution, 'TIRED', 1);
expectEqual('flow.totalEntries', summary.flow?.totalEntries, 2);
expectEqual('flow.daysWithFlow', summary.flow?.daysWithFlow, 2);
expectCount(summary.flow.distribution, 'MEDIUM', 1);
expectCount(summary.flow.distribution, 'HEAVY', 1);
expectEqual('symptoms.totalEntries', summary.symptoms?.totalEntries, 2);
expectSymptomCount(summary.symptoms.topSymptoms, SYMPTOM_NAME, 2);
expectEqual('notes.totalEntries', summary.notes?.totalEntries, 1);
expectEqual('temperature.average', summary.health?.temperature?.average, 36.8);
expectEqual('weight.average', summary.health?.weight?.average, 65.5);
expectEqual('water.totalAmount', summary.health?.water?.totalAmount, 750);
expectEqual('water.daysTracked', summary.health?.water?.daysTracked, 2);
expectEqual(
  'activity.totalDuration',
  summary.health?.activity?.totalDuration,
  75,
);
expectEqual(
  'activity.averageDuration',
  summary.health?.activity?.averageDuration,
  37.5,
);
expectCount(summary.health.activity.byType, 'WALKING', 1);
expectCount(summary.health.activity.byType, 'YOGA', 1);
expectEqual('sleep.average', summary.health?.sleep?.average, 7);
expectCount(summary.health.sleep.qualityDistribution, 'GOOD', 1);
expectCount(summary.health.sleep.qualityDistribution, 'FAIR', 1);
expectEqual(
  'intercourse.totalEntries',
  summary.health?.intercourse?.totalEntries,
  2,
);
expectEqual('intercourse.protected', summary.health?.intercourse?.protected, 1);
expectEqual('intercourse.unprotected', summary.health?.intercourse?.unprotected, 1);
expectEqual(
  'medications.totalEntries',
  summary.health?.medications?.totalEntries,
  1,
);
expectCount(summary.health.medications.uniqueMedications, MEDICATION_NAME, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      month: summary.month,
      periodDays: summary.cycles.periodDays,
      moodEntries: summary.moods.totalEntries,
      symptomEntries: summary.symptoms.totalEntries,
      healthEntries:
        summary.health.water.totalEntries +
        summary.health.activity.totalEntries +
        summary.health.sleep.totalEntries,
    },
    null,
    2,
  ),
);
