import type { ApprovalQueueItemDto } from '../../api/types';
import { CLASSIFICATION_SHORT_LABELS, DAY_TYPE_LABELS } from '../../types/meridian';
import styles from '../approvals/ApprovalQueue.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtH = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '');

/** The day-by-day breakdown table (Department/Account/Project/Task,
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
          <th>Task</th>
          <th>Type</th>
          {DAY_NAMES.map((d, i) => (
            <th key={d} style={{ width: 52 }}>
              {d}
              <div style={{ fontWeight: 400, fontSize: 'var(--fs-2xs)', color: 'var(--slate2)' }}>{DAY_TYPE_LABELS[item.dayTypes[i]?.dayType ?? '']?.label ?? item.dayTypes[i]?.dayType}</div>
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
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--slate)' }}>{line.departmentCode} › {line.accountName}</div>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{line.projectName}</div>
              </td>
              <td>
                {/* Only what the employee worked on. Older lines with no text fall back to the task name. */}
                {line.note || line.taskName ? (
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{line.note || line.taskName}</div>
                ) : (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clay)' }}>No description</div>
                )}
              </td>
              <td>
                <span className={styles.ft}>
                  {CLASSIFICATION_SHORT_LABELS[line.classification]}
                </span>
                {line.billingCategory && <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--slate2)', marginTop: 2 }}>{line.billingCategory}</div>}
              </td>
              {line.hoursByDay.map((v, i) => {
                const dayCap = item.dayTypes[i]?.capacityHours ?? 0;
                const mismatch = dayCap === 0 && v > 0;
                return (
                  <td key={i} className={mismatch ? styles.capMismatch : ''} style={{ textAlign: 'center' }}>
                    {fmtH(v) || <span style={{ color: 'var(--slate2)' }}>·</span>}
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
                <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 400, color: 'var(--slate2)' }}>/{cap}</div>
              </td>
            );
          })}
          <td style={{ textAlign: 'right' }}>{item.totalHours.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
