// The API client (httpClient.ts) is plain fetch code, not a React hook, so
// it can't read Context directly. This module is the deliberately small
// bridge: whichever component owns "who is currently logged in" calls
// setDevEmployeeCode(...) whenever it changes, and httpClient reads it at
// request time. Once real Microsoft login is switched on, setAccessTokenGetter
// should be wired up from the MSAL auth code instead (see auth/LoginGate.tsx).

const LOGGED_IN_EMPLOYEE_CODE_KEY = 'meridian_logged_in_employee_code';

/** Persists across page refreshes — LoginGate checks this to decide whether
 * to show the login page, and SessionContext reads it to know who's logged
 * in. Cleared on logout. */
export function getStoredEmployeeCode(): string | null {
  return localStorage.getItem(LOGGED_IN_EMPLOYEE_CODE_KEY);
}
export function storeEmployeeCode(code: string) {
  localStorage.setItem(LOGGED_IN_EMPLOYEE_CODE_KEY, code);
}
export function clearStoredEmployeeCode() {
  localStorage.removeItem(LOGGED_IN_EMPLOYEE_CODE_KEY);
}

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