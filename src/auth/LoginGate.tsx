import { useEffect, useState, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { isAzureConfigured, loginRequest } from './authConfig';
import { storeAuth, setAccessTokenGetter } from '../api/authBridge';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    return <NotConfiguredScreen />;
  }

  return <AzureGate>{children}</AzureGate>;
}

function NotConfiguredScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
        <h1>Microsoft sign-in isn't configured yet</h1>
        <p>
          VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID still need to be set in .env.
          Contact your admin, or see .env.example for what's needed.
        </p>
      </div>
    </div>
  );
}

/** Real Microsoft Entra login - the only login path. Once the sign-in
 * redirect completes, this acquires an API access token, resolves this
 * account's employee identity via GET /api/employees/me (which is what
 * actually links this Entra account to an Employee record on first sign-in
 * - see CurrentUserService on the backend), and only then renders children
 * - so everything under here (SessionContext included) can assume a
 * confirmed, resolved identity already exists. */
function AzureGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [status, setStatus] = useState<'pending' | 'ready' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

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
            ? "No employee record found for this Microsoft account. Contact your admin to get set up in Meridian first."
            : "Couldn't sign you in - please try again, or contact your admin if this keeps happening."
        );
        setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, accounts, instance]);

  if (!isAuthenticated) {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
          <h1>Sign in with Microsoft</h1>
          <button className={styles.signInBtn} onClick={() => instance.loginRedirect(loginRequest)}>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
          <h1>Couldn't sign you in</h1>
          <div className={styles.errMsg}>{error}</div>
          <button className={styles.signInBtn} onClick={() => instance.logoutRedirect()}>
            Sign out and try again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
          <p>Signing you in&hellip;</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
