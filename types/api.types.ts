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

export type CycleLog = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCycleRequest = {
  startDate: string;
  endDate?: string;
};

export type UpdateCycleRequest = Partial<CreateCycleRequest>;
