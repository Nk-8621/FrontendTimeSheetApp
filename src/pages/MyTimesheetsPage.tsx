import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { StatusPill } from '../components/ui/StatusPill';
import { useSession } from '../session/SessionContext';
import { useTimesheetHistory } from '../hooks/api/useTimesheet';
import { dayMonth, addDays } from '../lib/dates';
import styles from '../components/approvals/ApprovalQueue.module.css';

export function MyTimesheetsPage() {
  const { employeeCode } = useSession();
  const { data: weeks, isLoading, isError } = useTimesheetHistory(employeeCode);

  return (
    <>
      <PageHeader crumb="My Work" title="My Timesheets" />
      <div className="page-content">
        {isLoading && <Banner>Loading your timesheet history…</Banner>}
        {isError && <Banner kind="reject">Couldn't load your history — check that the backend API is reachable.</Banner>}

        {weeks && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Billable</th>
                <th style={{ textAlign: 'right' }}>Partial Billable</th>
                <th style={{ textAlign: 'right' }}>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {weeks.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.empty}>No timesheet history yet — log some hours on My Timesheet to get started.</div>
                  </td>
                </tr>
              ) : (
                weeks.map((w) => (
                  <tr key={w.weekStartDate}>
                    <td className="num">{dayMonth(w.weekStartDate)} – {dayMonth(addDays(w.weekStartDate, 6))}</td>
                    <td><StatusPill status={w.status} /></td>
                    <td className="num" style={{ textAlign: 'right' }}>{w.totalHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right' }}>{w.billableHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right' }}>{w.partialBillableHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right', color: 'var(--slate)' }}>
                      {w.submittedAt ? new Date(w.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/?week=${w.weekStartDate}`} className="num" style={{ color: 'var(--oxide)', fontWeight: 600, fontSize: 12 }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}