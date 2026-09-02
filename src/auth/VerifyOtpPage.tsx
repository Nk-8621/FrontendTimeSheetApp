import { useEffect, useState, type FormEvent } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/httpClient';
import styles from './LoginGate.module.css';

const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyOtpPageProps {
  employeeCode: string;
  onSuccess: (employeeCode: string, token: string, expiresAtUtc: string, fullName: string) => void;
  onBackToLogin: () => void;
}

export function VerifyOtpPage({ employeeCode, onSuccess, onBackToLogin }: VerifyOtpPageProps) {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => setCooldownRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword || !confirmNewPassword) {
      setError('Enter the code from your email, then your new password twice.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setInfo('');
    try {
      const result = await authApi.verifyFirstLoginOtp(employeeCode, otpCode.trim(), newPassword, confirmNewPassword);
      onSuccess(result.employeeCode, result.token!, result.expiresAtUtc!, result.fullName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify — check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError('');
    setInfo('');
    try {
      await authApi.resendFirstLoginOtp(employeeCode);
      setInfo('A new code has been sent to your email.');
      setCooldownRemaining(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code — try again shortly.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>CARBYNETECH TIMESHEET</div>
        <h1>Verify your email</h1>
        <p>
          We've sent a 6-digit code to the email on file for <b>{employeeCode}</b>. Enter it below along with a new
          password of your own choosing.
        </p>

        {error && <div className={styles.errMsg}>{error}</div>}
        {info && !error && <div className={styles.hint} style={{ marginTop: 0, marginBottom: 14 }}>{info}</div>}

        <div className={styles.field}>
          <label htmlFor="otpCode">Verification code</label>
          <input
            id="otpCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            autoFocus
            autoComplete="one-time-code"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters, with a letter and a number"
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="confirmNewPassword">Confirm new password</label>
          <input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
        </div>

        <button className={styles.signInBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify & set password'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldownRemaining > 0}
          style={{ background: 'none', border: 'none', color: cooldownRemaining > 0 ? '#9AA7B4' : '#17456B', fontSize: 12.5, marginTop: 12, cursor: cooldownRemaining > 0 ? 'default' : 'pointer' }}
        >
          {isResending ? 'Sending…' : cooldownRemaining > 0 ? `Resend code in ${cooldownRemaining}s` : 'Resend code'}
        </button>

        <div className={styles.hint}>
          Wrong account? <button type="button" onClick={onBackToLogin} style={{ background: 'none', border: 'none', color: '#17456B', cursor: 'pointer', padding: 0, font: 'inherit' }}>Back to sign in</button>
        </div>
      </form>
    </div>
  );
}