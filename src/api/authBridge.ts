// The API client (httpClient.ts) is plain fetch code, not a React hook, so
// it can't read Context directly. This module is the deliberately small
// bridge: whichever component owns "who is currently logged in" calls
// setDevEmployeeCode(...) whenever it changes, and httpClient reads it at
// request time. Once real Microsoft login is switched on, setAccessTokenGetter
// should be wired up from the MSAL auth code instead (see auth/LoginGate.tsx).

let devEmployeeCode: string | null = null;
let accessTokenGetter: (() => Promise<string | null>) | null = null;

export function setDevEmployeeCode(code: string | null) {
  devEmployeeCode = code;
}

export function setAccessTokenGetter(getter: (() => Promise<string | null>) | null) {
  accessTokenGetter = getter;
}

/** Builds the auth header for the next request. Prefers a real bearer token
 * (once MSAL is wired in) over the dev-mode header. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (accessTokenGetter) {
    const token = await accessTokenGetter();
    if (token) return { Authorization: `Bearer ${token}` };
  }
  if (devEmployeeCode) return { 'X-Dev-Employee-Code': devEmployeeCode };
  return {};
}
