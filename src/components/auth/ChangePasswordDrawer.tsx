import { useState } from 'react';
import { changePasswordApi } from '../../api/changePassword';
import { ApiError } from '../../api/httpClient';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ChangePasswordDrawerProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChangePasswordDrawer({ onSuccess, onCancel }: ChangePasswordDrawerProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Fill in all three fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await changePasswordApi.changePassword(currentPassword, newPassword, confirmNewPassword);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password — try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={controls.field}>
        <label>Current password <span className={controls.req}>*</span></label>
        <input
          type="password"
          className={controls.input}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />
      </div>
      <div className={controls.field}>
        <label>New password <span className={controls.req}>*</span></label>
        <input
          type="password"
          className={controls.input}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters, with a letter and a number"
          autoComplete="new-password"
        />
      </div>
      <div className={controls.field}>
        <label>Confirm new password <span className={controls.req}>*</span></label>
        <input
          type="password"
          className={controls.input}
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Changing…' : 'Change password'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}