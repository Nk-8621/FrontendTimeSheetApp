import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { Banner } from '../components/timesheet/Banner';
import { useProjectHoursReport } from '../hooks/api/useReports';
import { mondayOf, addDays, toISO, weekLabel } from '../lib/dates';
import { downloadCsv } from '../lib/csv';
import controls from '../styles/controls.module.css';
import styles from '../components/approvals/ApprovalQueue.module.css';

export function ReportsPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(toISO(new Date())));
  const { data: rows, isLoading, isError } = useProjectHoursReport(weekStart);

  const shiftWeek = (direction: -1 | 1) => setWeekStart((w) => addDays(w, direction * 7));

  const grandTotal = rows?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;
  const grandBillable = rows?.reduce((sum, r) => sum + r.billableHours, 0) ?? 0;

  function handleExport() {
    if (!rows) return;
    downloadCsv(
      `project-hours-${weekStart}.csv`,
      ['Project Code', 'Project Name', 'Account', 'Billable Hours', 'Non-Billable Hours', 'Total Hours', 'Employees'],
      rows.map((r) => [r.projectCode, r.projectName, r.accountName, r.billableHours, r.nonBillableHours, r.totalHours, r.employeeCount]),
    );
  }

  return (
    <>
      <PageHeader crumb="Oversight" title="Reports">
        <WeekNav weekStart={weekStart} onShift={shiftWeek} />
        <button className={`${controls.btn} ${controls.sm}`} onClick={handleExport} disabled={!rows || rows.length === 0}>
          Export CSV
        </button>
      </PageHeader>
      <div className="page-content">
        <Banner>Hours by project for {weekLabel(weekStart)}, across your team.</Banner>
        {isLoading && <Banner>Loading report…</Banner>}
        {isError && <Banner kind="reject">Couldn't load the report — check that the backend API is reachable.</Banner>}

        {rows && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Billable</th>
                <th style={{ textAlign: 'right' }}>Non-billable</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>People</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.empty}>No hours logged against any project this week.</div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.projectId}>
                    <td>
                      <div className={styles.name}>{r.projectName}</div>
                      <div className={styles.desig}>{r.projectCode}</div>
                    </td>
                    <td style={{ color: 'var(--slate)' }}>{r.accountName}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.billableHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.nonBillableHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{r.totalHours.toFixed(1)} h</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.employeeCount}</td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ fontWeight: 700 }}>Total</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{grandBillable.toFixed(1)} h</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{(grandTotal - grandBillable).toFixed(1)} h</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{grandTotal.toFixed(1)} h</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </>
  );
}