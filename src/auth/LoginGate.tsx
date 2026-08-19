import { useEffect, useState, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { isAzureConfigured, loginRequest } from './authConfig';
import { getStoredAuth, storeAuth, setAccessTokenGetter, type StoredAuth } from '../api/authBridge';
import { LoginPage } from './LoginPage';
import { VerifyOtpPage } from './VerifyOtpPage';
import styles from './LoginGate.module.css';

export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    return <DevLoginGate>{children}</DevLoginGate>;
  }

  return <AzureGate>{children}</AzureGate>;
}

type Screen = { step: 'login' } | { step: 'verify-otp'; employeeCode: string };

function DevLoginGate({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [screen, setScreen] = useState<Screen>({ step: 'login' });

  useEffect(() => {
    if (auth) setAccessTokenGetter(async () => getStoredAuth()?.token ?? null);
  }, [auth]);

  function handleSuccess(employeeCode: string, token: string, expiresAtUtc: string, fullName: string) {
    const newAuth: StoredAuth = { token, expiresAtUtc, employeeCode, fullName };
    storeAuth(newAuth);
    setAccessTokenGetter(async () => getStoredAuth()?.token ?? null);
    setAuth(newAuth);
  }

  if (!auth) {
    if (screen.step === 'verify-otp') {
      return (
        <VerifyOtpPage
          employeeCode={screen.employeeCode}
          onSuccess={handleSuccess}
          onBackToLogin={() => setScreen({ step: 'login' })}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={handleSuccess}
        onRequiresOtpVerification={(employeeCode) => setScreen({ step: 'verify-otp', employeeCode })}
      />
    );
  }

  return (
    <>
      {children}
    </>
  );
}

function AzureGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  if (!isAuthenticated) {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.brand}>MERIDIAN</div>
          <h1>Sign in with Microsoft</h1>
          <button className={styles.signInBtn} onClick={() => instance.loginRedirect(loginRequest)}>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}