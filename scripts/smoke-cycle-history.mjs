const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile History Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-history-${Date.now()}@example.com`;
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

const history = await request('/cycles/history', {
  headers: authHeaders(session.token),
});

expectEqual('stats.totalCycles', history.stats?.totalCycles, 3);
expectEqual('stats.completeCycles', history.stats?.completeCycles, 3);
expectEqual('stats.averageDuration', history.stats?.averageDuration, 5);
expectEqual('stats.averageCycleLength', history.stats?.averageCycleLength, 29);
expectEqual(
  'stats.shortestCycleLength',
  history.stats?.shortestCycleLength,
  28,
);
expectEqual('stats.longestCycleLength', history.stats?.longestCycleLength, 30);
expectEqual(
  'stats.regularity.status',
  history.stats?.regularity?.status,
  'REGULAR',
);

if (!Array.isArray(history.cycles) || history.cycles.length !== 3) {
  throw new Error(
    `cycles: expected 3 history rows, got ${history.cycles?.length}`,
  );
}

expectEqual(
  'latest cycle start',
  history.cycles[0].startDate.slice(0, 10),
  toDateKey(latestStart),
);
expectEqual('latest cycle length', history.cycles[0].cycleLength, null);
expectEqual('middle cycle length', history.cycles[1].cycleLength, 30);
expectEqual('oldest cycle length', history.cycles[2].cycleLength, 28);

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      totalCycles: history.stats.totalCycles,
      averageCycleLength: history.stats.averageCycleLength,
      regularity: history.stats.regularity.status,
    },
    null,
    2,
  ),
);
