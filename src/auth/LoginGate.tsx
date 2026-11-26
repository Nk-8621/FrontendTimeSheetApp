import { useState, type FormEvent, type ReactNode } from 'react';
import { Icon } from '../components/ui/Icon';
import { clearStoredAuth, getStoredAuth, setAccessTokenGetter, storeAuth, type StoredAuth } from '../api/authBridge';
import styles from './LoginGate.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// httpClient reads the stored token on every request, so an expired
// session automatically stops sending it.
setAccessTokenGetter(async () => getStoredAuth()?.token ?? null);

/** Username/password admin login - replaces Microsoft Entra sign-in.
 * Renders children only once a valid, unexpired session is stored, so
 * everything below (SessionContext included) can assume a resolved identity. */
export function LoginGate({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());

  if (!auth) return <LoginScreen onLogin={setAuth} />;
  return <>{children}</>;
}

function LoginScreen({ onLogin }: { onLogin: (auth: StoredAuth) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.title ?? `Sign-in failed (${res.status})`);
        return;
      }
      const auth: StoredAuth = {
        token: body.token,
        expiresAtUtc: body.expiresAtUtc,
        employeeCode: body.employeeCode,
        fullName: body.fullName,
      };
      clearStoredAuth();
      storeAuth(auth);
      onLogin(auth);
    } catch {
      setError("Couldn't reach the server - please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      {/* Left: decorative background - dusk sky with the sun on the horizon over a
          glowing data landscape (public/login-bg.svg, vector, sharp at any size). */}
      <section className={styles.photoSide} aria-hidden="true">
        <img className={styles.photo} src="/login-bg.svg" alt="" />
      </section>

      {/* Right: full-height solid white sign-in panel. */}
      <main className={styles.formSide}>
        {/* Logo, heading, form and footer as one block, centred vertically. */}
        <div className={styles.panelInner}>
        <header className={styles.panelTop}>
          {/* The panel is always white, so it always uses the original logo. */}
          <img className={styles.logo} src="/carbynetech-logo.png" alt="Carbynetech - Data to decisions made simpler" />
        </header>

        <form className={styles.card} onSubmit={submit}>
          <div className={styles.heading}>
            <h1>Welcome back</h1>
            <p>Sign in to Carbynetech Timesheet with the admin account.</p>
          </div>

          {error && (
            <div className={styles.errMsg} role="alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="login-username">Username</label>
            <div className={styles.inputWrap}>
              <Icon name="user" className={styles.inputIcon} />
              <input id="login-username" autoComplete="username" value={username}
                onChange={(e) => setUsername(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.inputWrap}>
              <Icon name="lock" className={styles.inputIcon} />
              <input id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoFocus />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                aria-pressed={showPw}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPw ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>

          <button className={styles.signInBtn} type="submit" disabled={busy}>
            {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <Icon name="arrowRight" />}
          </button>

        </form>

        <footer className={styles.foot}>© {new Date().getFullYear()} Carbynetech India Pvt Ltd</footer>
        </div>
      </main>
    </div>
  );
}
