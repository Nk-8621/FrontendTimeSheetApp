import { useState } from 'react';
import { Banner } from '../timesheet/Banner';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ApproveDrawerProps {
  flags: string[];
  nextStepText: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export function ApproveDrawer({ flags, nextStepText, onConfirm, onCancel }: ApproveDrawerProps) {
  const [comment, setComment] = useState('');

  return (
    <div>
      {flags.length > 0 ? (
        <Banner kind="warn">
          <b>This week has {flags.length} flag{flags.length > 1 ? 's' : ''}</b>
          <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
            {flags.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <div style={{ marginTop: 6 }}>Approving records that you have seen and accepted these.</div>
        </Banner>
      ) : (
        <Banner><b>No flags.</b> Hours match available capacity and every substantial line is described.</Banner>
      )}
      <div className={controls.field}>
        <label>Comment (optional)</label>
        <textarea
          className={controls.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Visible to the employee and to the next approval level."
        />
      </div>
      <Banner>{nextStepText}</Banner>
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.ok}`} onClick={() => onConfirm(comment.trim())}>Approve</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}