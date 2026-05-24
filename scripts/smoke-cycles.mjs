const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Cycle Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-cycles-${Date.now()}@example.com`;
const START_DATE = process.env.SMOKE_CYCLE_START_DATE || '2026-05-10';
const END_DATE = process.env.SMOKE_CYCLE_END_DATE || '2026-05-14';

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

function assertDate(label, value, expectedDateKey) {
  if (typeof value !== 'string' || !value.startsWith(expectedDateKey)) {
    throw new Error(`${label}: expected ${expectedDateKey}, got ${value}`);
  }
}

await register();
const session = await login();

if (!session?.token) {
  throw new Error('login: missing token');
}

const createdCycle = await request('/cycles', {
  method: 'POST',
  headers: authHeaders(session.token),
  body: JSON.stringify({
    startDate: START_DATE,
  }),
});

if (!createdCycle?.id) {
  throw new Error('cycles create: missing id');
}

assertDate('cycles create startDate', createdCycle.startDate, START_DATE);

if (createdCycle.endDate !== null) {
  throw new Error(
    `cycles create: expected open cycle, got ${createdCycle.endDate}`,
  );
}

const updatedCycle = await request(`/cycles/${createdCycle.id}`, {
  method: 'PATCH',
  headers: authHeaders(session.token),
  body: JSON.stringify({
    startDate: START_DATE,
    endDate: END_DATE,
  }),
});

assertDate('cycles update startDate', updatedCycle.startDate, START_DATE);
assertDate('cycles update endDate', updatedCycle.endDate, END_DATE);

if (typeof updatedCycle.duration !== 'number') {
  throw new Error('cycles update: expected duration to be calculated');
}

const cycles = await request('/cycles', {
  headers: authHeaders(session.token),
});

if (
  !Array.isArray(cycles) ||
  !cycles.some((cycle) => cycle.id === createdCycle.id)
) {
  throw new Error('cycles list: created cycle was not returned');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      cycleId: createdCycle.id,
      startDate: START_DATE,
      endDate: END_DATE,
      duration: updatedCycle.duration,
    },
    null,
    2,
  ),
);
