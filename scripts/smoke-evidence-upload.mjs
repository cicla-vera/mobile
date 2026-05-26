const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Evidence Upload Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL || `mobile-evidence-${Date.now()}@example.com`;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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

await register();
const session = await login();

if (!session?.token) {
  throw new Error('login: missing token');
}

const headers = authHeaders(session.token);

await request('/vera/profile', {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    consentAccepted: true,
    monitoringEnabled: true,
    veraEnabled: true,
  }),
});

const alertSession = await request('/vera/alert-sessions/manual', {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Smoke test evidence upload session',
  }),
});

const formData = new FormData();
const blob = new Blob(['Cicla Vera evidence upload smoke test'], {
  type: 'text/plain',
});
const file = new File([blob], 'smoke-evidence.txt', {
  type: 'text/plain',
});

formData.append('type', 'FILE');
formData.append('file', file);
formData.append(
  'metadata',
  JSON.stringify({
    source: 'smoke_test',
  }),
);

let uploaded;

try {
  uploaded = await request(
    `/vera/alert-sessions/${alertSession.id}/evidence`,
    {
      method: 'POST',
      headers,
      body: formData,
    },
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Evidence storage is not configured')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          apiUrl: API_URL,
          skipped: 'evidence_storage_not_configured',
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  throw error;
}

if (!uploaded?.id || uploaded.type !== 'FILE') {
  throw new Error('upload: expected FILE evidence record');
}

const records = await request(
  `/vera/alert-sessions/${alertSession.id}/evidence`,
  { headers },
);

if (!records.some((record) => record.id === uploaded.id)) {
  throw new Error('evidence list: expected uploaded record');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      alertSessionId: alertSession.id,
      apiUrl: API_URL,
      email: EMAIL,
      evidenceRecordId: uploaded.id,
    },
    null,
    2,
  ),
);
