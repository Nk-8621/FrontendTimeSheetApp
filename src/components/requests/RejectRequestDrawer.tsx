import { useState } from 'react';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface RejectRequestDrawerProps {
  employeeName: string;
  onConfirm: (comment: string | null) => void;
  onCancel: () => void;
}

export function RejectRequestDrawer({ employeeName, onConfirm, onCancel }: RejectRequestDrawerProps) {
  const [comment, setComment] = useState('');

  return (
    <div>
      <div className={controls.field}>
        <label>Note for {employeeName} (optional)</label>
        <textarea
          className={controls.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Let them know why, if it helps."
          autoFocus
        />
      </div>
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.dgr}`} onClick={() => onConfirm(comment.trim() || null)}>
          Reject request
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
