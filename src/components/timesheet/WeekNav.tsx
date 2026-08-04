import { weekLabel } from '../../lib/dates';
import styles from './WeekNav.module.css';

interface WeekNavProps {
  weekStart: string;
  onShift: (direction: -1 | 1) => void;
}

export function WeekNav({ weekStart, onShift }: WeekNavProps) {
  return (
    <div className={styles.wkNav}>
      <button title="Previous week" onClick={() => onShift(-1)}>‹</button>
      <span className={styles.lbl}>{weekLabel(weekStart)}</span>
      <button title="Next week" onClick={() => onShift(1)}>›</button>
    </div>
  );
}
