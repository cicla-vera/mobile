const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME =
  process.env.SMOKE_AUTH_NAME || 'Mobile Apple Health Import Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-apple-health-import-${Date.now()}@example.com`;
const DATE = process.env.SMOKE_APPLE_HEALTH_DATE || '2026-05-22';

function at(time) {
  return `${DATE}T${time}.000Z`;
}

function buildRecord(attributes, children = '') {
  const serializedAttributes = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  if (!children) {
    return `  <Record ${serializedAttributes} />`;
  }

  return `  <Record ${serializedAttributes}>\n${children}\n  </Record>`;
}

const records = [
  buildRecord({
    type: 'HKCategoryTypeIdentifierMenstrualFlow',
    sourceName: 'Health',
    sourceVersion: '17.0',
    startDate: at('09:00:00'),
    endDate: at('09:05:00'),
    value: 'HKCategoryValueMenstrualFlowMedium',
  }),
  buildRecord({
    type: 'HKQuantityTypeIdentifierBasalBodyTemperature',
    sourceName: 'Health',
    sourceVersion: '17.0',
    unit: 'degC',
    startDate: at('07:00:00'),
    endDate: at('07:00:00'),
    value: '36.7',
  }),
  buildRecord({
    type: 'HKQuantityTypeIdentifierBodyMass',
    sourceName: 'Health',
    sourceVersion: '17.0',
    unit: 'kg',
    startDate: at('08:00:00'),
    endDate: at('08:00:00'),
    value: '64.5',
  }),
  buildRecord({
    type: 'HKQuantityTypeIdentifierDietaryWater',
    sourceName: 'Health',
    sourceVersion: '17.0',
    unit: 'L',
    startDate: at('10:00:00'),
    endDate: at('10:00:00'),
    value: '0.35',
  }),
  buildRecord({
    type: 'HKCategoryTypeIdentifierSleepAnalysis',
    sourceName: 'Health',
    sourceVersion: '17.0',
    startDate: at('00:00:00'),
    endDate: at('07:30:00'),
    value: 'HKCategoryValueSleepAnalysisAsleepCore',
  }),
  buildRecord(
    {
      type: 'HKCategoryTypeIdentifierSexualActivity',
      sourceName: 'Health',
      sourceVersion: '17.0',
      startDate: at('22:00:00'),
      endDate: at('22:00:00'),
      value: 'HKCategoryValue',
    },
    '    <MetadataEntry key="HKSexualActivityProtectionUsed" value="1" />',
  ),
  buildRecord({
    type: 'HKCategoryTypeIdentifierCervicalMucusQuality',
    sourceName: 'Health',
    sourceVersion: '17.0',
    startDate: at('12:00:00'),
    endDate: at('12:00:00'),
    value: 'HKCategoryValueCervicalMucusQualityEggWhite',
  }),
].join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="pt_BR">
${records}
</HealthData>`;

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

const result = await request('/import/apple-health', {
  method: 'POST',
  headers,
  body: JSON.stringify({ xml }),
});

expectEqual('source', result.source, 'apple-health');
expectEqual('cycles', result.imported.cycles, 1);
expectEqual('flow entries', result.imported.flowEntries, 1);
expectEqual('symptom entries', result.imported.symptomEntries, 1);
expectEqual('temperature entries', result.imported.temperatureEntries, 1);
expectEqual('weight entries', result.imported.weightEntries, 1);
expectEqual('water entries', result.imported.waterEntries, 1);
expectEqual('sleep entries', result.imported.sleepEntries, 1);
expectEqual('intercourse entries', result.imported.intercourseEntries, 1);

const history = await request('/cycles/history', { headers });

if (!Array.isArray(history.cycles) || history.cycles.length === 0) {
  throw new Error('cycle history: expected imported Apple Health cycle');
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
