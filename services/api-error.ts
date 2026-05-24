import { isApiError } from '@/services/api';

function normalizeMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message.join('\n');
  }

  return message;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isApiError(error)) {
    return fallback;
  }

  const message = normalizeMessage(error.response?.data?.message);

  if (message) {
    if (message === 'Invalid credentials') {
      return 'Email ou senha incorretos.';
    }

    if (message === 'Email already in use') {
      return 'Este email ja esta em uso.';
    }

    return message;
  }

  if (error.code === 'ECONNABORTED') {
    return 'A conexao demorou demais. Tente novamente.';
  }

  return fallback;
}
