const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Prediction Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-prediction-${Date.now()}@example.com`;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

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

function utcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

async function createCycle(token, startDate, endDate) {
  return request('/cycles', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      startDate: toDateKey(startDate),
      endDate: toDateKey(endDate),
    }),
  });
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

const today = utcDay();
const latestStart = addDays(today, -15);
const middleStart = addDays(latestStart, -30);
const oldestStart = addDays(middleStart, -28);

await Promise.all([
  createCycle(session.token, oldestStart, addDays(oldestStart, 5)),
  createCycle(session.token, middleStart, addDays(middleStart, 5)),
  createCycle(session.token, latestStart, addDays(latestStart, 4)),
]);

const prediction = await request('/cycles/predict', {
  headers: authHeaders(session.token),
});

const expectedNextPeriod = addDays(latestStart, 29);
const expectedOvulation = addDays(expectedNextPeriod, -14);
const expectedFertileStart = addDays(expectedOvulation, -5);
const expectedFertileEnd = addDays(expectedOvulation, 1);

expectEqual('averageCycleLength', prediction.averageCycleLength, 29);
expectEqual('currentCycleDay', prediction.currentCycleDay, 16);
expectEqual('daysUntilNextPeriod', prediction.daysUntilNextPeriod, 14);
expectEqual(
  'nextPeriod.date',
  prediction.nextPeriod?.date,
  toDateKey(expectedNextPeriod),
);
expectEqual(
  'ovulationDate.date',
  prediction.ovulationDate?.date,
  toDateKey(expectedOvulation),
);
expectEqual(
  'fertileWindow.start',
  prediction.fertileWindow?.start,
  toDateKey(expectedFertileStart),
);
expectEqual(
  'fertileWindow.end',
  prediction.fertileWindow?.end,
  toDateKey(expectedFertileEnd),
);
expectEqual('basedOnCycles', prediction.basedOnCycles, 3);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      nextPeriod: prediction.nextPeriod,
      ovulationDate: prediction.ovulationDate,
      fertileWindow: prediction.fertileWindow,
    },
    null,
    2,
  ),
);
