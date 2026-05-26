const DEFAULT_API_URL = 'http://127.0.0.1:3001/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || 'SmokePass123';
const NAME = process.env.SMOKE_AUTH_NAME || 'Mobile Smoke Test';
const EMAIL =
  process.env.SMOKE_AUTH_EMAIL ||
  `mobile-smoke-${Date.now()}@example.com`;

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

function assertSession(label, session) {
  if (!session || typeof session.token !== 'string' || !session.token) {
    throw new Error(`${label}: missing token`);
  }

  if (!session.user || typeof session.user.id !== 'string') {
    throw new Error(`${label}: missing user id`);
  }

  if (session.user.email !== EMAIL) {
    throw new Error(
      `${label}: expected email ${EMAIL}, got ${session.user.email}`,
    );
  }
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

async function getCurrentUser(token) {
  return request('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

const registeredSession = await register();

if (registeredSession) {
  assertSession('register', registeredSession);
}

const loginSession = await login();
assertSession('login', loginSession);

const currentUser = await getCurrentUser(loginSession.token);

if (!currentUser || currentUser.email !== EMAIL) {
  throw new Error(
    `users/me: expected email ${EMAIL}, got ${currentUser?.email}`,
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiUrl: API_URL,
      email: EMAIL,
      userId: loginSession.user.id,
      registeredNewUser: Boolean(registeredSession),
    },
    null,
    2,
  ),
);
