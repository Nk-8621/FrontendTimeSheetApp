import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { useSession } from '../../session/SessionContext';
import controls from '../../styles/controls.module.css';
import { StatusPill } from '../ui/StatusPill';
import { useTimesheetHistory } from '../../hooks/api/useTimesheet';
import { dayMonth, addDays } from '../../lib/dates';
import styles from './RecentTimesheetsCard.module.css';

interface RecentTimesheetsCardProps {
  employeeCode: string;
  /** The week open in My Timesheet - its row is highlighted. */
  selectedWeek: string;
  /** Opens that week in My Timesheet. */
  onView: (weekStart: string) => void;
}

const LAST_WEEKS = 10;

/** My Timesheet: the employee's last 10 timesheets with their status
 * (the full list is on the All Timesheets page). */
export function RecentTimesheetsCard({ employeeCode, selectedWeek, onView }: RecentTimesheetsCardProps) {
  const { nav } = useSession();
  const { data: weeks, isError } = useTimesheetHistory(employeeCode);
  const recent = [...(weeks ?? [])]
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
    .slice(0, LAST_WEEKS);

  return (
    <Card
      title="All Timesheets"
      sub={weeks ? `Last ${Math.min(LAST_WEEKS, recent.length)} weeks` : undefined}
      noPad
      headerRight={nav.includes('hist') && (
        <Link to="/hist" className={`${controls.btn} ${controls.sm}`}>
          View all
          <Icon name="arrowRight" />
        </Link>
      )}
    >
      {isError && <div className={styles.empty}>Couldn't load your timesheets.</div>}
      {weeks && recent.length === 0 && <div className={styles.empty}>No timesheets yet.</div>}
      {recent.length > 0 && (
        // Scrolls inside the card, same height as the Approval trail next to it.
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th className={styles.viewCol}>View</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((w) => (
                <tr key={w.weekStartDate} className={w.weekStartDate === selectedWeek ? styles.selected : undefined}>
                  <td className="num">{dayMonth(w.weekStartDate)} – {dayMonth(addDays(w.weekStartDate, 6))}</td>
                  <td><StatusPill status={w.status} /></td>
                  <td className={`num ${styles.muted}`}>{w.submittedAt ? new Date(w.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className={styles.viewCol}>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      title="View this week"
                      aria-label={`View week of ${dayMonth(w.weekStartDate)}`}
                      onClick={() => onView(w.weekStartDate)}
                    >
                      <Icon name="eye" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
