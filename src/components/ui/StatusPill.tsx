import { WEEK_STATUS_LABELS } from '../../types/meridian';
import styles from './StatusPill.module.css';

interface StatusPillProps {
  status: string;
  /** Defaults to the week-status labels; pass a different map (e.g.
   * DAY_TYPE_REQUEST_STATUS_LABELS) to reuse this same pill elsewhere. */
  labels?: Record<string, { css: string; label: string }>;
}

export function StatusPill({ status, labels = WEEK_STATUS_LABELS }: StatusPillProps) {
  const info = labels[status] ?? { css: 'p-draft', label: status };
  return (
    <span className={`${styles.pill} ${styles[info.css]}`}>
      <i className={styles.dot} />
      {info.label}
    </span>
  );
}
