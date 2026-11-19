import { useState } from 'react';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ApproveDrawerProps {
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export function ApproveDrawer({ onConfirm, onCancel }: ApproveDrawerProps) {
  const [comment, setComment] = useState('');

  return (
    <div>
      {/* The flag warning was removed (Nov 2026) - the flags already show as
          chips on the approval row, so repeating them here was noise. */}
      <div className={controls.field}>
        <label>Comment (optional)</label>
        <textarea
          className={controls.textarea}
          value={comment}
          maxLength={200}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Visible to the employee and to the next approval level."
        />
        <div className={controls.hint}>Shown on the week's approval trail. Up to 200 characters.</div>
      </div>
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.ok}`} onClick={() => onConfirm(comment.trim())}>Approve</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
