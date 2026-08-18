// The API client (httpClient.ts) is plain fetch code, not a React hook, so
// it can't read Context directly. This module is the deliberately small
// bridge: whichever component owns "who is currently logged in" calls
// setAccessTokenGetter(...) once, and httpClient reads it at request time.

const AUTH_STORAGE_KEY = 'meridian_auth';

export interface StoredAuth {
  token: string;
  expiresAtUtc: string; // ISO string
  employeeCode: string;
  fullName: string;
}

/** Reads the stored session, if any — and transparently clears + returns
 * null if the token has already expired, so callers never have to check
 * expiry themselves. */
export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: StoredAuth = JSON.parse(raw);
    if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

let accessTokenGetter: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(getter: (() => Promise<string | null>) | null) {
  accessTokenGetter = getter;
}

/** Builds the Authorization header for the next request. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (accessTokenGetter) {
    const token = await accessTokenGetter();
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}