import { useState, type FormEvent } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

interface LoginPageProps {
  onSuccess: (employeeCode: string, token: string, expiresAtUtc: string, fullName: string) => void;
  onRequiresOtpVerification: (employeeCode: string) => void;
  onForgotPassword: () => void;
}

export function LoginPage({ onSuccess, onRequiresOtpVerification, onForgotPassword }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Enter your employee ID (or email) and password.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const result = await authApi.login(identifier.trim(), password);
      if (result.requiresOtpVerification) {
        onRequiresOtpVerification(result.employeeCode);
      } else {
        onSuccess(result.employeeCode, result.token!, result.expiresAtUtc!, result.fullName);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in - check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>MERIDIAN</div>
        <h1>Sign in to continue</h1>
        <p>Enter your employee ID or email, and your password.</p>

        {error && <div className={styles.errMsg}>{error}</div>}

        <div className={styles.field}>
          <label htmlFor="identifier">Employee ID or Email</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="CBT1267 or you@carbynetech.com"
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            autoComplete="current-password"
          />
        </div>

        <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={onForgotPassword}
            style={{ background: 'none', border: 'none', color: '#17456B', cursor: 'pointer', padding: 0, fontSize: 12 }}
          >
            Forgot password?
          </button>
        </div>

        <button className={styles.signInBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className={styles.hint}>Carbynetech Timesheet</div>
      </form>
    </div>
  );
}