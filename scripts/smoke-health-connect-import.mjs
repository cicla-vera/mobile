const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME =
  process.env.SMOKE_AUTH_NAME || 'Mobile Health Connect Import Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-health-connect-import-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_HEALTH_CONNECT_DATE || '2026-05-23';

function at(time) {
  return `${DATE}T${time}.000Z`;
}

const payload = {
  records: [
    {
      recordType: 'MenstruationPeriodRecord',
      startTime: at('00:00:00'),
      endTime: '2026-05-26T00:00:00.000Z',
    },
    {
      recordType: 'MenstruationFlowRecord',
      time: at('09:00:00'),
      flow: '2',
    },
    {
      recordType: 'BasalBodyTemperatureRecord',
      time: at('07:00:00'),
      temperature: {
        inCelsius: 36.8,
      },
    },
    {
      recordType: 'WeightRecord',
      time: at('08:00:00'),
      weight: {
        inKilograms: 64.7,
      },
    },
    {
      recordType: 'HydrationRecord',
      time: at('10:00:00'),
      volume: {
        inLiters: 0.5,
      },
    },
    {
      recordType: 'SleepSessionRecord',
      startTime: at('00:10:00'),
      endTime: at('07:20:00'),
    },
    {
      recordType: 'ExerciseSessionRecord',
      startTime: at('18:00:00'),
      endTime: at('18:42:00'),
      activityType: 'walking',
      intensity: 'medium',
    },
    {
      recordType: 'SexualActivityRecord',
      time: at('22:00:00'),
      protected: true,
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

const result = await request('/import/health-connect', {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
});

expectEqual('source', result.source, 'health-connect');
expectEqual('cycles', result.imported.cycles, 1);
expectEqual('flow entries', result.imported.flowEntries, 1);
expectEqual('temperature entries', result.imported.temperatureEntries, 1);
expectEqual('weight entries', result.imported.weightEntries, 1);
expectEqual('water entries', result.imported.waterEntries, 1);
expectEqual('sleep entries', result.imported.sleepEntries, 1);
expectEqual('activity entries', result.imported.activityEntries, 1);
expectEqual('intercourse entries', result.imported.intercourseEntries, 1);

const history = await request('/cycles/history', { headers });

if (!Array.isArray(history.cycles) || history.cycles.length === 0) {
  throw new Error('cycle history: expected imported Health Connect cycle');
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
