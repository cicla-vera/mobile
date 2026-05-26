const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Profile Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-profile-${Date.now()}@example.com`;
const UPDATED_NAME = process.env.SMOKE_PROFILE_NAME || `${NAME} Updated`;
const UPDATED_PHONE = process.env.SMOKE_PROFILE_PHONE || '+5581999990000';
const UPDATED_BIRTH_DATE = process.env.SMOKE_PROFILE_BIRTH_DATE || '1996-05-12';

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
const profile = await request('/users/me', { headers });

expectEqual('profile.email', profile.email, EMAIL);
expectEqual('profile.name', profile.name, NAME);

const updated = await request('/users/me', {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    name: UPDATED_NAME,
    phone: UPDATED_PHONE,
    birthDate: UPDATED_BIRTH_DATE,
  }),
});

expectEqual('updated.email', updated.email, EMAIL);
expectEqual('updated.name', updated.name, UPDATED_NAME);
expectEqual('updated.phone', updated.phone, UPDATED_PHONE);

if (!updated.birthDate?.startsWith(UPDATED_BIRTH_DATE)) {
  throw new Error(
    `updated.birthDate: expected ${UPDATED_BIRTH_DATE}, got ${updated.birthDate}`,
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      name: updated.name,
      phone: updated.phone,
      birthDate: updated.birthDate,
    },
    null,
    2,
  ),
);
