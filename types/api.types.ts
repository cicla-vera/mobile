export type ApiErrorResponse = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  name: string;
};
