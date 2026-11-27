import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  storeAuth,
  clearStoredAuth,
  setAccessTokenGetter,
  getDevEmployeeCode,
  setDevEmployeeCode,
} from '../api/authBridge';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

/**
 * DRY-RUN TEST LOGIN - local testing only (branch dryrun-test-login).
 *
 * Active only when the app runs under `npm run dev` (import.meta.env.DEV)
 * AND VITE_DEV_LOGIN=true (set in .env.development.local, which is not
 * committed). A production build (`npm run build`) never includes it.
 *
 * Instead of redirecting to Microsoft, the tester types an employee code.
 * Every API call then carries the X-Dev-Employee-Code header, which the
 * backend accepts only when it runs locally with the "DryRunTestLogin"
 * launch profile and the request comes from localhost.
 *
 * The chosen code is kept per browser tab (sessionStorage), so two tabs
 * can be signed in as two different people (e.g. employee + approver).
 */

const RECENT_KEY = 'meridian_dev_recent_codes';

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function addRecent(code: string) {
  const list = [code, ...getRecent().filter((c) => c !== code)].slice(0, 12);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

/** Signs the current tab out of the test login and reloads to the picker. */
export function devSwitchUser() {
  setDevEmployeeCode(null);
  clearStoredAuth();
  setAccessTokenGetter(null);
  window.location.reload();
}

export function DevLoginGate({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string | null>(() => getDevEmployeeCode());
  const [status, setStatus] = useState<'idle' | 'pending' | 'ready' | 'error'>(code ? 'pending' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setStatus('pending');
    setDevEmployeeCode(code);

    (async () => {
      try {
        const me = await employeesApi.getMe();
        if (cancelled) return;
        storeAuth({
          token: '',
          expiresAtUtc: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          employeeCode: me.employeeCode,
          fullName: me.fullName,
        });
        addRecent(me.employeeCode);
        setFullName(me.fullName);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setDevEmployeeCode(null);
        clearStoredAuth();
        setError(
          err instanceof ApiError && err.status === 401
            ? `"${code}" is not an active employee code, or the backend is not running with the DryRunTestLogin profile.`
            : `Couldn't reach the backend (${err instanceof Error ? err.message : 'unknown error'}). Is it running on VITE_API_BASE_URL?`
        );
        setCode(null);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  function signIn(value: string) {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    setError(null);
    setCode(trimmed);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    signIn(input);
  }

  if (status === 'ready' && code) {
    return (
      <>
        {children}
        <div className={styles.devPill} role="status">
          <span>TEST LOGIN · {code}{fullName ? ` – ${fullName}` : ''}</span>
          <button type="button" onClick={devSwitchUser}>Switch user</button>
        </div>
      </>
    );
  }

  if (status === 'pending') {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
          <p>Signing in as {code}&hellip;</p>
        </div>
      </div>
    );
  }

  const recent = getRecent();
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
        <div className={styles.devBanner}>TEST LOGIN – local dry run only, no Microsoft sign-in</div>
        <h1 style={{ marginTop: 18 }}>Sign in as an employee</h1>
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="devEmployeeCode">Employee code</label>
            <input
              id="devEmployeeCode"
              autoFocus
              placeholder="e.g. CBT1267"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          {error && <div className={styles.errMsg}>{error}</div>}
          <button type="submit" className={styles.signInBtn} disabled={!input.trim()}>
            Sign in as {input.trim().toUpperCase() || '<employee code>'}
          </button>
        </form>
        {recent.length > 0 && (
          <div className={styles.recentCodes}>
            <span>Recent:</span>
            {recent.map((c) => (
              <button key={c} type="button" onClick={() => signIn(c)}>{c}</button>
            ))}
          </div>
        )}
        <div className={styles.hint}>Tip: each browser tab keeps its own test user, so you can keep an employee and an approver open side by side.</div>
      </div>
    </div>
  );
}
