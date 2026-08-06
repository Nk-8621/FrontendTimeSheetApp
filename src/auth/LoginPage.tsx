import { useState, type FormEvent } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

interface LoginPageProps {
  onSuccess: (employeeCode: string) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employeeCode.trim() || !password) {
      setError('Enter both your employee ID and password.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const employee = await authApi.login(employeeCode.trim().toUpperCase(), password);
      onSuccess(employee.employeeCode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in — check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>CARBYNETECH</div>
        <h1>Sign in to continue</h1>
        <p>Enter your employee ID and password.</p>

        {error && <div className={styles.errMsg}>{error}</div>}

        <div className={styles.field}>
          <label htmlFor="employeeCode">Employee ID</label>
          <input
            id="employeeCode"
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="e.g. CBT1267"
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
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button className={styles.signInBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className={styles.hint}>Carbynetech Timesheet · dev-phase login</div>
      </form>
    </div>
  );
}