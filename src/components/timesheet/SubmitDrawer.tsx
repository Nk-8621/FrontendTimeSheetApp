import { useValidateWeek } from '../../hooks/api/useApprovals';
import { Banner } from './Banner';
import controls from '../../styles/controls.module.css';
import styles from './EntryDrawer.module.css';

interface SubmitDrawerProps {
  employeeCode: string;
  weekStart: string;
  entryCount: number;
  totalHours: number;
  billableHours: number;
  partialBillableHours: number;
  leadName: string;
  l2Name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const fmt = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '0');

/** Validation now runs on the backend (Meridian.Application.Services.TimesheetValidator)
 * rather than being duplicated here — this drawer just displays whatever it returns. */
export function SubmitDrawer({
  employeeCode,
  weekStart,
  entryCount,
  totalHours,
  billableHours,
  partialBillableHours,
  leadName,
  l2Name,
  onConfirm,
  onCancel,
}: SubmitDrawerProps) {
  const { data: validation, isLoading } = useValidateWeek(employeeCode, weekStart, true);
  const nonBillable = totalHours - billableHours - partialBillableHours;
  const errors = validation?.errors ?? [];
  const warnings = validation?.warnings ?? [];

  return (
    <div>
      {isLoading && <Banner>Checking this week for issues…</Banner>}

      {!isLoading && errors.length > 0 && (
        <Banner kind="reject">
          <div>
            <b>{errors.length} issue{errors.length > 1 ? 's' : ''} must be fixed before submitting</b>
            <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </Banner>
      )}
      {!isLoading && warnings.length > 0 && (
        <Banner kind="warn">
          <div>
            <b>{warnings.length} thing{warnings.length > 1 ? 's' : ''} to confirm</b>
            <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
            <div style={{ marginTop: 6 }}>You can still submit — your lead will see these flags.</div>
          </div>
        </Banner>
      )}
      {!isLoading && errors.length === 0 && warnings.length === 0 && (
        <Banner>
          <b>Nothing to flag.</b> {fmt(totalHours)} h logged, all lines described.
        </Banner>
      )}

      <div className={controls.field} style={{ border: '1px solid var(--rule)', borderRadius: 'var(--rLg)', padding: '10px 12px' }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr><td style={{ color: 'var(--slate)' }}>Total hours</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(totalHours)} h</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Billable</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(billableHours)} h</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Partial Billable</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(partialBillableHours)} h</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Non-billable</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(nonBillable)} h</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Task lines</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{entryCount}</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Level 1 approver</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{leadName}</td></tr>
            <tr><td style={{ color: 'var(--slate)' }}>Level 2 approver</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{l2Name}</td></tr>
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} disabled={isLoading || errors.length > 0} onClick={onConfirm}>
          Submit for approval
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
