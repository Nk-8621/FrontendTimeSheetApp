import { useEffect, useState, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { isAzureConfigured, loginRequest } from './authConfig';
import { getStoredAuth, storeAuth, setAccessTokenGetter, type StoredAuth } from '../api/authBridge';
import { LoginPage } from './LoginPage';
import { VerifyOtpPage } from './VerifyOtpPage';
import { RequestPasswordResetPage } from './RequestPasswordResetPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import styles from './LoginGate.module.css';

export function LoginGate({ children }: { children: ReactNode }) {
  if (!isAzureConfigured()) {
    return <DevLoginGate>{children}</DevLoginGate>;
  }

  return <AzureGate>{children}</AzureGate>;
}

type Screen =
  | { step: 'login' }
  | { step: 'verify-otp'; employeeCode: string }
  | { step: 'forgot-password-request' }
  | { step: 'forgot-password-reset'; identifier: string };

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

    if (screen.step === 'forgot-password-request') {
      return (
        <RequestPasswordResetPage
          onSubmitted={(identifier) => setScreen({ step: 'forgot-password-reset', identifier })}
          onBackToLogin={() => setScreen({ step: 'login' })}
        />
      );
    }

    if (screen.step === 'forgot-password-reset') {
      return (
        <ResetPasswordPage
          identifier={screen.identifier}
          onSuccess={handleSuccess}
          onBackToLogin={() => setScreen({ step: 'login' })}
        />
      );
    }

    return (
      <LoginPage
        onSuccess={handleSuccess}
        onRequiresOtpVerification={(employeeCode) => setScreen({ step: 'verify-otp', employeeCode })}
        onForgotPassword={() => setScreen({ step: 'forgot-password-request' })}
      />
    );
  }

  return (
    <>
      {/* <div className={styles.devBanner}>Signed in - OTP-based authentication active.</div> */}
      {children}
    </>
  );
}

// --- Real Microsoft Entra login - dormant until VITE_AZURE_CLIENT_ID /
// VITE_AZURE_TENANT_ID are configured. Kept as-is; not part of this change. ---
function AzureGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

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

  return <>{children}</>;
}