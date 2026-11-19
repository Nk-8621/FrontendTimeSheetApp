import { useState } from 'react';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

// Only things the employee types or decides themselves - the app already
// blocks incomplete days, leave/holiday hours and wrong projects/billing.
const REASONS = [
  'Task description is missing or unclear',
  'Task name is too general (e.g. "Work", "Meeting")',
  'User story name is unclear',
  'Hours on a task look too high or too low',
  'Same work entered more than once',
  'Work is not related to this project',
  'Other',
];

const OTHER = 'Other';
const OTHER_REASON_LIMIT = 80;

interface RejectDrawerProps {
  employeeName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectDrawer({ employeeName, onConfirm, onCancel }: RejectDrawerProps) {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const isOther = reason === OTHER;
  // When "Other" is picked, the approver's own words are saved as the reason.
  const finalReason = isOther ? otherReason.trim() : reason;

  // The final text is "<reason> — <comments>", stored in a 200-character
  // column on the approval trail - so the comments get whatever room is left.
  const noteLimit = Math.max(20, 200 - (finalReason ? finalReason.length + 3 : 0));

  function handleConfirm() {
    if (!finalReason || !note.trim()) {
      setShowErrors(true);
      return;
    }
    onConfirm(`${finalReason} — ${note.trim()}`);
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Reason <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setShowErrors(false); }}
        >
          <option value="">Select a reason</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {showErrors && !reason && <div className={styles.errMsg}>Pick a reason so {employeeName} knows what to fix.</div>}
      </div>

      {isOther && (
        <div className={controls.field}>
          <label>Enter your reason <span className={controls.req}>*</span></label>
          <input
            className={controls.textInput}
            type="text"
            value={otherReason}
            maxLength={OTHER_REASON_LIMIT}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="e.g. Client meeting hours not shown"
            autoFocus
          />
          {showErrors && !otherReason.trim() && <div className={styles.errMsg}>Enter your reason.</div>}
        </div>
      )}

      <div className={controls.field}>
        <label>Comments for the employee <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={note}
          maxLength={noteLimit}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tell the employee exactly what to correct, e.g. Move Wednesday's 3 h from 'UI Screens' to 'Data Correction'."
        />
        {showErrors && !note.trim() && <div className={styles.errMsg}>Add a short comment.</div>}
        <div className={controls.hint}>{note.length} / {noteLimit} characters</div>
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
