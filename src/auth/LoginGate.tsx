import { useEffect, useState, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { isAzureConfigured, loginRequest } from './authConfig';
import { storeAuth, setAccessTokenGetter } from '../api/authBridge';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/httpClient';
import { Icon } from '../components/ui/Icon';
import styles from './LoginGate.module.css';

// UI REDESIGN (Nov 2026): sign-in still uses Microsoft (Entra) exactly as
// before - only the screens are restyled to Sai Kiran's design (decorative
// picture on the left, white panel with the Carbynetech logo on the right).

/** Microsoft sign-in is the only way in. Renders children only once a
 * real Entra login has resolved to an active employee. */
export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    return <NotConfiguredScreen />;
  }
  return <AzureGate>{children}</AzureGate>;
}

/** The sign-in page frame: picture on the left, white panel on the right. */
function SignInFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.screen}>
      {/* Left: decorative background (public/login-bg.svg). */}
      <section className={styles.photoSide} aria-hidden="true">
        <img className={styles.photo} src="/login-bg.svg" alt="" />
      </section>

      {/* Right: white sign-in panel. */}
      <main className={styles.formSide}>
        <div className={styles.panelInner}>
          <header className={styles.panelTop}>
            {/* The panel is always white, so it always uses the original logo. */}
            <img className={styles.logo} src="/carbynetech-logo.png" alt="Carbynetech - Data to decisions made simpler" />
          </header>
          <div className={styles.card}>{children}</div>
          <footer className={styles.foot}>© {new Date().getFullYear()} Carbynetech India Pvt Ltd</footer>
        </div>
      </main>
    </div>
  );
}

function NotConfiguredScreen() {
  return (
    <SignInFrame>
      <div className={styles.heading}>
        <h1>Microsoft sign-in isn't configured yet</h1>
        <p>
          VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID still need to be set in .env.
          Contact your admin, or see .env.example for what's needed.
        </p>
      </div>
    </SignInFrame>
  );
}

function AzureGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const [status, setStatus] = useState<'pending' | 'ready' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  // No account signed in yet, and MSAL isn't already mid-redirect (e.g. handling
  // the callback from Microsoft) - kick off the sign-in redirect automatically
  // instead of waiting for a button click.
  useEffect(() => {
    if (isAuthenticated || inProgress !== InteractionStatus.None) return;
    instance.loginRedirect(loginRequest).catch(() => {
      // Swallow - the fallback button on the screen below still lets the user retry.
    });
  }, [isAuthenticated, inProgress, instance]);

  useEffect(() => {
    if (!isAuthenticated || accounts.length === 0) return;
    let cancelled = false;
    const account = accounts[0];

    setAccessTokenGetter(async () => {
      try {
        const result = await instance.acquireTokenSilent({ ...loginRequest, account });
        return result.accessToken;
      } catch {
        // Silent refresh failed (e.g. needs re-consent) - fall back to an
        // interactive popup rather than losing the whole app to a redirect.
        try {
          const result = await instance.acquireTokenPopup(loginRequest);
          return result.accessToken;
        } catch {
          return null;
        }
      }
    });

    (async () => {
      try {
        const me = await employeesApi.getMe();
        if (cancelled) return;
        storeAuth({
          token: '', // unused for real requests - the accessTokenGetter above is what httpClient actually calls
          expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          employeeCode: me.employeeCode,
          fullName: me.fullName,
        });
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 401
            ? "No active employee record was found for this Microsoft account — either you haven't been set up yet, or your access has been deactivated. Contact your admin."
            : "Couldn't sign you in - please try again, or contact your admin if this keeps happening."
        );
        setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, accounts, instance]);

  if (!isAuthenticated) {
    return (
      <SignInFrame>
        <div className={styles.heading}>
          <h1>Welcome back</h1>
          <p>Redirecting you to Microsoft sign-in&hellip;</p>
        </div>
        <button type="button" className={styles.signInBtn} onClick={() => instance.loginRedirect(loginRequest)}>
          Sign in with Microsoft
          <Icon name="arrowRight" />
        </button>
        <p className={styles.hint}>Click the button if you're not redirected automatically.</p>
      </SignInFrame>
    );
  }

  if (status === 'error') {
    return (
      <SignInFrame>
        <div className={styles.heading}>
          <h1>Couldn't sign you in</h1>
        </div>
        <div className={styles.errMsg} role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
        <button type="button" className={styles.signInBtn} onClick={() => instance.logoutRedirect()}>
          Sign out and try again
        </button>
      </SignInFrame>
    );
  }

  if (status === 'pending') {
    return (
      <SignInFrame>
        <div className={styles.heading}>
          <h1>Welcome back</h1>
          <p>Signing you in&hellip;</p>
        </div>
        <button type="button" className={styles.signInBtn} disabled>
          <span className={styles.spinner} aria-hidden="true" />
          Signing in…
        </button>
      </SignInFrame>
    );
  }

  return <>{children}</>;
}
