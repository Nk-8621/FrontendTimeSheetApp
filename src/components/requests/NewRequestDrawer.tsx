import { useState } from 'react';
import type { DayTypeRequestType } from '../../api/types';
import { DAY_TYPE_REQUEST_LABELS } from '../../types/meridian';
import { toISO } from '../../lib/dates';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface NewRequestDrawerProps {
  onSave: (data: { date: string; requestType: DayTypeRequestType; note: string | null }) => void;
  onCancel: () => void;
}

const TYPES: DayTypeRequestType[] = ['WFH', 'LeaveFirstHalf', 'LeaveSecondHalf', 'LeaveFull'];

const TYPE_HINTS: Record<DayTypeRequestType, string> = {
  WFH: 'The day stays a full 8h working day, just marked WFH.',
  LeaveFirstHalf: 'First half of the day is leave (4h); the second half is still worked and logged as usual.',
  LeaveSecondHalf: 'Second half of the day is leave (4h); the first half is still worked and logged as usual.',
  LeaveFull: 'The whole day counts as leave — no task hours needed.',
};

export function NewRequestDrawer({ onSave, onCancel }: NewRequestDrawerProps) {
  const today = toISO(new Date());
  const [date, setDate] = useState(today);
  const [requestType, setRequestType] = useState<DayTypeRequestType>('WFH');
  const [note, setNote] = useState('');
  const [showDateError, setShowDateError] = useState(false);
  const [showNoteError, setShowNoteError] = useState(false);

  function handleSave() {
    if (!date || date < today) {
      setShowDateError(true);
      return;
    }
    if (note.trim() === '') {
      setShowNoteError(true);
      return;
    }
    onSave({ date, requestType, note: note.trim() });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Date <span className={controls.req}>*</span></label>
        <input
          type="date"
          className={controls.textInput}
          value={date}
          min={today}
          onChange={(e) => { setDate(e.target.value); setShowDateError(false); }}
        />
        {showDateError && <div className={styles.errMsg}>Pick today or a future day — a past day can't be requested.</div>}
      </div>

      <div className={controls.field}>
        <label>Request type <span className={controls.req}>*</span></label>
        <div className={styles.segBill}>
          {TYPES.map((t) => (
            <button key={t} className={requestType === t ? styles.on : ''} onClick={() => setRequestType(t)}>
              {DAY_TYPE_REQUEST_LABELS[t]}
            </button>
          ))}
        </div>
        <div className={controls.hint}>{TYPE_HINTS[requestType]}</div>
      </div>

      <div className={controls.field}>
        <label>Note <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setShowNoteError(false);
          }}
          placeholder="Let your manager know why you're requesting this."
        />
        {showNoteError && <div className={styles.errMsg}>Add a short note explaining this request.</div>}
      </div>

      <div className={controls.hint} style={{ marginBottom: 12 }}>
        This takes effect right away — the day updates on your timesheet immediately, shown as Pending until your
        manager approves or rejects it. If it's rejected, the day reverts automatically.
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>Submit request</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
