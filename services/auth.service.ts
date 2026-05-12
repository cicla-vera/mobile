import { api } from '@/services/api';
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '@/types/api.types';

export async function login(payload: LoginRequest) {
  const response = await api.post<AuthSession>('/auth/login', payload);

  return response.data;
}

export async function register(payload: RegisterRequest) {
  const response = await api.post<AuthSession>('/auth/register', payload);

  return response.data;
}

export const authService = {
  login,
  register,
};
