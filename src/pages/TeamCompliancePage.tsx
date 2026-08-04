import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { StatusPill } from '../components/ui/StatusPill';
import { Banner } from '../components/timesheet/Banner';
import { useTeamCompliance } from '../hooks/api/useTeam';
import { useSession } from '../session/SessionContext';
import { mondayOf, addDays, toISO } from '../lib/dates';
import styles from '../components/approvals/ApprovalQueue.module.css';

export function TeamCompliancePage() {
  const { roleId } = useSession();
  const [weekStart, setWeekStart] = useState(() => mondayOf(toISO(new Date())));
  const { data: rows, isLoading, isError } = useTeamCompliance(weekStart);

  const shiftWeek = (direction: -1 | 1) => setWeekStart((w) => addDays(w, direction * 7));
  const nonCompliantCount = rows?.filter((r) => !r.hasLogged).length ?? 0;

  return (
    <>
      <PageHeader crumb="Oversight" title="Team Compliance">
        <WeekNav weekStart={weekStart} onShift={shiftWeek} />
      </PageHeader>
      <div className="page-content">
        <Banner>
          {roleId === 'ADMIN' ? 'Showing every employee in the organization.' : 'Showing your direct reports.'}
        </Banner>
        {isLoading && <Banner>Loading compliance data…</Banner>}
        {isError && <Banner kind="reject">Couldn't load compliance data — check that the backend API is reachable.</Banner>}

        {rows && (
          <>
            {nonCompliantCount > 0 && (
              <Banner kind="warn">{nonCompliantCount} {nonCompliantCount > 1 ? 'people have' : 'person has'} not logged any hours this week.</Banner>
            )}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Hours logged</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className={styles.empty}>No direct reports found.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.employeeCode}>
                      <td>
                        <div className={styles.name}>{r.fullName}</div>
                        <div className={styles.desig}>{r.designation}</div>
                      </td>
                      <td><StatusPill status={r.status} /></td>
                      <td className="num" style={{ textAlign: 'right', color: r.hasLogged ? 'var(--ink)' : 'var(--clay)' }}>
                        {r.totalHours.toFixed(1)} h
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}