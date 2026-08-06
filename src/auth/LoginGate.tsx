import { useState, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { isAzureConfigured, loginRequest } from './authConfig';
import { getStoredEmployeeCode, storeEmployeeCode } from '../api/authBridge';
import { LoginPage } from './LoginPage';
import styles from './LoginGate.module.css';

export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    // Dev mode: no Azure AD wired up yet. A real login page (employee ID +
    // shared dev-phase password) stands in for it — see LoginPage.tsx —
    // rather than the earlier "Viewing as" switcher, so each person only
    // ever sees their own role-appropriate screens.
    return <DevLoginGate>{children}</DevLoginGate>;
  }

  return <AzureGate>{children}</AzureGate>;
}

function DevLoginGate({ children }: { children: ReactNode }) {
  const [employeeCode, setEmployeeCode] = useState<string | null>(() => getStoredEmployeeCode());

  if (!employeeCode) {
    return (
      <LoginPage
        onSuccess={(code) => {
          storeEmployeeCode(code);
          setEmployeeCode(code);
        }}
      />
    );
  }

  return (
    <>
      {/* <div className={styles.devBanner}>Dev-phase login — shared password, standing in for Microsoft sign-in.</div> */}
      {children}
    </>
  );
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