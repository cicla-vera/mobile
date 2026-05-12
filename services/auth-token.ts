export type AuthTokenGetter = () => Promise<string | null> | string | null;

let authTokenGetter: AuthTokenGetter = () => null;

export function setAuthTokenGetter(getter: AuthTokenGetter) {
  authTokenGetter = getter;
}

export async function getAuthToken() {
  return authTokenGetter();
}
