import { useEffect } from 'react';
import styles from './ConfirmDialog.module.css';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Text on the confirm button, e.g. "Delete". Defaults to "OK". */
  confirmLabel?: string;
  /** Red confirm button - for actions that remove something. */
  danger?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-app confirmation box (white, centred, with a warning symbol), used
 * instead of the browser's window.confirm. Open it through useUI().confirm.
 * Esc or a click outside the box cancels.
 */
export function ConfirmDialog({ title, message, confirmLabel = 'OK', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmTitle"
        aria-describedby="confirmMessage"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.row}>
          <div className={styles.icon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <div>
            <h3 id="confirmTitle" className={styles.title}>{title}</h3>
            <p id="confirmMessage" className={styles.message}>{message}</p>
          </div>
        </div>
        <div className={styles.buttons}>
          {/* Cancel gets the focus, so pressing Enter by accident doesn't delete anything. */}
          <button type="button" className={styles.btn} onClick={onCancel} autoFocus>Cancel</button>
          <button type="button" className={`${styles.btn} ${danger ? styles.danger : styles.primary}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
