import type { ApprovalQueueItemDto } from '../../api/types';
import styles from '../approvals/ApprovalQueue.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtH = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '');

/** The day-by-day breakdown table (Department/Account/Project/Module/Task,
 * hours per day, capacity-mismatch highlighting) — shared between the
 * Approval Queue's expandable rows and Team Compliance's "view what they
 * actually logged" detail, so both stay visually identical and only need
 * fixing in one place. */
export function WeekDetailTable({ item }: { item: ApprovalQueueItemDto }) {
  const dailyTotals = DAY_NAMES.map((_, i) => item.lines.reduce((sum, l) => sum + l.hoursByDay[i], 0));

  return (
    <table className={styles.detailTable}>
      <thead>
        <tr>
          <th>Department › Customer › Project</th>
          <th>Module › Task</th>
          <th>Type</th>
          {DAY_NAMES.map((d, i) => (
            <th key={d} style={{ width: 52 }}>
              {d}
              <div style={{ fontWeight: 400, fontSize: 9, color: 'var(--slate2)' }}>{item.dayTypes[i]?.dayType.slice(0, 3)}</div>
            </th>
          ))}
          <th style={{ textAlign: 'right' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {item.lines.map((line, idx) => {
          const lineTotal = line.hoursByDay.reduce((a, b) => a + b, 0);
          return (
            <tr key={idx}>
              <td>
                <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{line.departmentCode} › {line.accountName}</div>
                <div style={{ fontWeight: 600, fontSize: 11.5 }}>{line.projectName}</div>
              </td>
              <td>
                <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{line.moduleName}</div>
                <div style={{ fontSize: 11.5, fontWeight: 500 }}>{line.taskName}</div>
                <div style={{ fontSize: 10.5, color: line.note ? 'var(--slate)' : 'var(--clay)', marginTop: 2 }}>
                  {line.note || 'No description'}
                </div>
              </td>
              <td>
                <span className={styles.ft}>
                  {line.classification === 'Billable' ? 'Bill' : line.classification === 'PartialBillable' ? 'Partial' : 'Non-b'}
                </span>
                {line.billingCategory && <div style={{ fontSize: 9, color: 'var(--slate2)', marginTop: 2 }}>{line.billingCategory}</div>}
              </td>
              {line.hoursByDay.map((v, i) => {
                const dayCap = item.dayTypes[i]?.capacityHours ?? 0;
                const mismatch = dayCap === 0 && v > 0;
                return (
                  <td key={i} className={mismatch ? styles.capMismatch : ''} style={{ textAlign: 'center' }}>
                    {fmtH(v) || <span style={{ color: '#D3DAE2' }}>·</span>}
                  </td>
                );
              })}
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtH(lineTotal)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className={styles.detailFoot}>
          <td colSpan={3}>Daily total / capacity</td>
          {dailyTotals.map((t, i) => {
            const cap = item.dayTypes[i]?.capacityHours ?? 0;
            return (
              <td key={i} style={{ textAlign: 'center', color: t < cap ? 'var(--amber)' : undefined }}>
                {fmtH(t) || '—'}
                <div style={{ fontSize: 9, fontWeight: 400, color: 'var(--slate2)' }}>/{cap}</div>
              </td>
            );
          })}
          <td style={{ textAlign: 'right' }}>{item.totalHours.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  );
}