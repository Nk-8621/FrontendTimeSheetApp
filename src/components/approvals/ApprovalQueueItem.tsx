import { useState } from 'react';
import type { ApprovalQueueItemDto } from '../../api/types';
import { useApprovalMutations } from '../../hooks/api/useApprovals';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import { dayMonth, addDays } from '../../lib/dates';
import { ApproveDrawer } from './ApproveDrawer';
import { RejectDrawer } from './RejectDrawer';
import controls from '../../styles/controls.module.css';
import styles from './ApprovalQueue.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtH = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '');

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

interface ApprovalQueueItemProps {
  item: ApprovalQueueItemDto;
  level2: boolean;
}

export function ApprovalQueueItem({ item, level2 }: ApprovalQueueItemProps) {
  const [open, setOpen] = useState(false);
  const mutations = useApprovalMutations(item.employeeCode, item.weekStartDate);
  const { openDrawer, closeDrawer, toast } = useUI();

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function handleApprove() {
    openDrawer({
      title: 'Approve timesheet',
      body: (
        <ApproveDrawer
          flags={item.flags}
          nextStepText={level2 ? 'On approval the week is locked. Later changes need an adjustment request.' : 'On approval this moves to Level 2.'}
          onCancel={closeDrawer}
          onConfirm={() => {
            const mutation = level2 ? mutations.approveLevel2 : mutations.approveLevel1;
            mutation.mutate(undefined, {
              onSuccess: () => { closeDrawer(); toast(`${item.fullName} approved at Level ${level2 ? 2 : 1}`, 'ok'); },
              onError: (err) => showError(err, 'Could not approve this week'),
            });
          }}
        />
      ),
    });
  }

  function handleReject() {
    openDrawer({
      title: 'Return for correction',
      body: (
        <RejectDrawer
          employeeName={item.fullName}
          onCancel={closeDrawer}
          onConfirm={(reason) => {
            mutations.reject.mutate(reason, {
              onSuccess: () => { closeDrawer(); toast(`Returned to ${item.fullName}`, 'bad'); },
              onError: (err) => showError(err, 'Could not return this week'),
            });
          }}
        />
      ),
    });
  }

  const isBusy = mutations.approveLevel1.isPending || mutations.approveLevel2.isPending || mutations.reject.isPending;
  const pctBillable = item.totalHours ? Math.round((item.billableHours / item.totalHours) * 100) : 0;

  const dailyTotals = DAY_NAMES.map((_, i) => item.lines.reduce((sum, l) => sum + l.hoursByDay[i], 0));

  return (
    <div className={`${styles.qRow} ${item.flags.length ? styles.flag : styles.clean} ${open ? styles.open : ''}`}>
      <div className={styles.qHd} onClick={() => setOpen((o) => !o)}>
        <span className={styles.caret}>▶</span>
        <div className={styles.avatar}>{initialsOf(item.fullName)}</div>
        <div style={{ minWidth: 170 }}>
          <div className={styles.name}>{item.fullName}</div>
          <div className={styles.mt}>{item.designation} · {item.departmentName}</div>
        </div>
        <div style={{ minWidth: 150 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>{dayMonth(item.weekStartDate)} – {dayMonth(addDays(item.weekStartDate, 6))}</div>
          <div className={styles.mt}>Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}</div>
        </div>
        <div style={{ minWidth: 96 }}>
          <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>{item.totalHours.toFixed(1)} h</div>
          <div className={styles.mt}>{item.projectCount} project{item.projectCount !== 1 ? 's' : ''} · {item.lineCount} lines</div>
        </div>
        <div style={{ minWidth: 120 }}>
          <div className={styles.bar}>
            <i style={{ width: `${item.totalHours ? (item.billableHours / item.totalHours) * 100 : 0}%`, background: 'var(--oxide)', display: 'block', height: '100%' }} />
            <i style={{ width: `${item.totalHours ? (item.partialBillableHours / item.totalHours) * 100 : 0}%`, background: 'var(--violet)', display: 'block', height: '100%' }} />
            <i style={{ width: `${item.totalHours ? (item.nonBillableHours / item.totalHours) * 100 : 0}%`, background: 'var(--slate2, #C7CEDA)', display: 'block', height: '100%' }} />
          </div>
          <div className={`${styles.mt} num`}>{pctBillable}% billable</div>
        </div>
        <div style={{ flex: 1 }} />
        <button className={`${controls.btn} ${controls.ok} ${controls.sm}`} disabled={isBusy} onClick={(e) => { e.stopPropagation(); handleApprove(); }}>
          Approve
        </button>
        <button className={`${controls.btn} ${controls.dgr} ${controls.sm}`} disabled={isBusy} onClick={(e) => { e.stopPropagation(); handleReject(); }} style={{ marginLeft: 6 }}>
          Return
        </button>
      </div>

      {item.flags.length > 0 && (
        <div className={styles.flagRow}>
          <b>Flags:</b>
          {item.flags.map((f) => <span key={f} className={styles.ft}>{f}</span>)}
        </div>
      )}

      <div className={styles.qBd}>
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
                  <td><span className={`${controls.btn} ${controls.sm}`} style={{ pointerEvents: 'none', padding: '2px 8px', fontSize: 10.5 }}>{line.classification === 'Billable' ? 'Bill' : line.classification === 'PartialBillable' ? 'Partial' : 'Non-b'}</span></td>
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
      </div>
    </div>
  );
}