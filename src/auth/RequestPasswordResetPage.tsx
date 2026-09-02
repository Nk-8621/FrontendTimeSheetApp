import { useState, type FormEvent } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

interface RequestPasswordResetPageProps {
  onSubmitted: (identifier: string) => void;
  onBackToLogin: () => void;
}

export function RequestPasswordResetPage({ onSubmitted, onBackToLogin }: RequestPasswordResetPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Enter your employee ID or email.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      // This always succeeds regardless of whether the identifier matched a
      // real account - that's deliberate (see AuthController), not a bug.
      await authApi.requestPasswordReset(identifier.trim());
      onSubmitted(identifier.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the reset code - check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
        <h1>Reset your password</h1>
        <p>Enter your employee ID or email and we'll send a code to your registered email.</p>

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

        <button className={styles.signInBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset code'}
        </button>

        <div className={styles.hint}>
          Remembered your password?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            style={{ background: 'none', border: 'none', color: '#17456B', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}