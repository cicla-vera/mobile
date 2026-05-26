import { api } from '@/services/api';
import type {
  SetVeraPinRequest,
  VeraPinStatus,
  VerifyVeraPinRequest,
  VerifyVeraPinResponse,
} from '@/types/vera.types';

export async function setVeraPin(payload: SetVeraPinRequest) {
  const response = await api.post<VeraPinStatus>('/vera/pin', payload);

  return response.data;
}

export async function verifyVeraPin(payload: VerifyVeraPinRequest) {
  const response = await api.post<VerifyVeraPinResponse>(
    '/vera/pin/verify',
    payload,
  );

  return response.data;
}

export const veraPinService = {
  setVeraPin,
  verifyVeraPin,
};
