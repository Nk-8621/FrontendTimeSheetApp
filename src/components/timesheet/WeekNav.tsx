import { weekLabel, addDays, parseISO } from '../../lib/dates';
import { Icon } from '../ui/Icon';
import { WeekPickerTrigger } from '../ui/DatePicker';
import styles from './WeekNav.module.css';

interface WeekNavProps {
  weekStart: string;
  onShift: (direction: -1 | 1) => void;
  /** Jump straight to a week. If not given, the jump is made with
   * onShift steps (every page's shift handler uses a functional update,
   * so repeated steps add up correctly). */
  onPick?: (weekStart: string) => void;
}

/** Week picker: previous / week label (opens the calendar) / next. */
export function WeekNav({ weekStart, onShift, onPick }: WeekNavProps) {
  const pick = (target: string) => {
    if (target === weekStart) return;
    if (onPick) {
      onPick(target);
      return;
    }
    const weeks = Math.round((parseISO(target).getTime() - parseISO(weekStart).getTime()) / (7 * 86400000));
    const dir: -1 | 1 = weeks < 0 ? -1 : 1;
    for (let i = 0; i < Math.abs(weeks); i++) onShift(dir);
  };

  return (
    <div className={styles.wkNav}>
      <button type="button" title="Previous week" aria-label="Previous week" onClick={() => onShift(-1)}>
        <Icon name="chevronLeft" />
      </button>
      <WeekPickerTrigger weekStart={weekStart} onPick={pick} className={styles.lbl} openClassName={styles.lblOpen}>
        <Icon name="calendar" />
        {weekLabel(weekStart)}
        <span className={styles.srOnly}> (choose week, ends {addDays(weekStart, 6)})</span>
      </WeekPickerTrigger>
      <button type="button" title="Next week" aria-label="Next week" onClick={() => onShift(1)}>
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}
