import { useState } from 'react';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

const REASONS = [
  'Hours do not match the work reported',
  'Missing or vague task descriptions',
  'Wrong project or module selected',
  'Billable / non-billable classification incorrect',
  'Hours logged on leave, holiday or weekly off',
  'Total hours below expected capacity',
  'Other',
];

interface RejectDrawerProps {
  employeeName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectDrawer({ employeeName, onConfirm, onCancel }: RejectDrawerProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  function handleConfirm() {
    if (!reason || !note.trim()) {
      setShowReasonError(true);
      return;
    }
    onConfirm(`${reason} — ${note.trim()}`);
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Reason <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setShowReasonError(false); }}
        >
          <option value="">Select a reason</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {showReasonError && !reason && <div className={styles.errMsg}>Pick a reason so {employeeName} knows what to fix.</div>}
      </div>
      <div className={controls.field}>
        <label>What needs to change? <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Be specific — e.g. Thursday shows 8 h on NML but you were on the Wockhardt call all afternoon."
          autoFocus
        />
        {showReasonError && !note.trim() && <div className={styles.errMsg}>Add a short note.</div>}
      </div>
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.dgr}`} onClick={handleConfirm}>
          Return to {employeeName}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}