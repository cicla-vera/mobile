import axios, { AxiosError } from 'axios';

import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/auth-token';
import type { ApiErrorResponse } from '@/types/api.types';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function isApiError(
  error: unknown,
): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError<ApiErrorResponse>(error);
}
