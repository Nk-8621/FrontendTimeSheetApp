import { WEEK_STATUS_LABELS } from '../../types/meridian';
import styles from './StatusPill.module.css';

export function StatusPill({ status }: { status: string }) {
  const info = WEEK_STATUS_LABELS[status] ?? { css: 'p-draft', label: status };
  return (
    <span className={`${styles.pill} ${styles[info.css]}`}>
      <i className={styles.dot} />
      {info.label}
    </span>
  );
}
