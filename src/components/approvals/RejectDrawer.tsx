import { useState } from 'react';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface RejectDrawerProps {
  employeeName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectDrawer({ employeeName, onConfirm, onCancel }: RejectDrawerProps) {
  const [reason, setReason] = useState('');

  return (
    <div>
      <div className={controls.field}>
        <label>Why is {employeeName}'s week being returned? <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Be specific — this is what they'll see and need to act on."
          autoFocus
        />
      </div>
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.dgr}`} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
          Return for correction
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
