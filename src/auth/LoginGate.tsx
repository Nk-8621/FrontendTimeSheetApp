import type { ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { isAzureConfigured, loginRequest } from './authConfig';
import styles from './LoginGate.module.css';

export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    // Dev mode: no Azure AD wired up yet. Let the person straight into the
    // app; the sidebar's "Viewing as" switcher stands in for a real login.
    return (
      <>
        <div className={styles.devBanner}>
          Dev mode — Microsoft login isn't configured yet. Set VITE_AZURE_CLIENT_ID / VITE_AZURE_TENANT_ID in .env to enable it.
        </div>
        {children}
      </>
    );
  }

  return <AzureGate>{children}</AzureGate>;
}

function AzureGate({ children }: { children: ReactNode }) {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>MERIDIAN</div>
        <h1>Sign in to continue</h1>
        <p>Use your Carbynetech Microsoft account to access the timesheet.</p>
        <button className={styles.signInBtn} onClick={() => instance.loginRedirect(loginRequest)}>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
