import { useState } from 'react';
import type { DayTypeRequestType } from '../../api/types';
import { toISO, parseISO } from '../../lib/dates';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface NewRequestDrawerProps {
  onSave: (data: { date: string; requestType: DayTypeRequestType; note: string | null }) => void;
  onCancel: () => void;
}

/** What the Request type dropdown offers. The three leave kinds then ask for
 * a Duration (Full day / Custom -> which half) to pick the actual request type. */
type RequestKind = 'WFH' | 'OnDuty' | 'PaidLeave' | 'UnpaidLeave' | 'CompOff';
type Duration = 'Full' | 'Custom';
type Half = 'First' | 'Second';

const KINDS: { value: RequestKind; label: string }[] = [
  { value: 'WFH', label: 'WFH' },
  { value: 'OnDuty', label: 'On Duty' },
  { value: 'PaidLeave', label: 'Paid Leave' },
  { value: 'UnpaidLeave', label: 'Unpaid Leave' },
  { value: 'CompOff', label: 'Comp-Off' },
];

/** Request-type prefix of each leave kind - each has <prefix>Full / FirstHalf / SecondHalf. */
const LEAVE_PREFIX: Partial<Record<RequestKind, 'Leave' | 'Unpaid' | 'CompOff'>> = {
  PaidLeave: 'Leave',
  UnpaidLeave: 'Unpaid',
  CompOff: 'CompOff',
};

function toRequestType(kind: RequestKind, duration: Duration, half: Half): DayTypeRequestType {
  const prefix = LEAVE_PREFIX[kind];
  if (!prefix) return kind as 'WFH' | 'OnDuty';
  return duration === 'Full' ? `${prefix}Full` : `${prefix}${half}Half`;
}

const TYPE_HINTS: Record<DayTypeRequestType, string> = {
  WFH: 'The day stays a full 8h working day, just marked WFH.',
  OnDuty: 'The day stays a full 8h working day, marked On Duty (e.g. client site, official travel).',
  LeaveFirstHalf: 'First half of the day is paid leave (4h); the second half is still worked and logged as usual.',
  LeaveSecondHalf: 'Second half of the day is paid leave (4h); the first half is still worked and logged as usual.',
  LeaveFull: 'The whole day counts as paid leave (8h) — no task hours needed.',
  UnpaidFirstHalf: 'First half of the day is unpaid leave (4h); the second half is still worked and logged as usual.',
  UnpaidSecondHalf: 'Second half of the day is unpaid leave (4h); the first half is still worked and logged as usual.',
  UnpaidFull: 'The whole day counts as unpaid leave (8h) — no task hours needed.',
  CompOffFirstHalf: 'First half of the day is a comp-off (4h); the second half is still worked and logged as usual.',
  CompOffSecondHalf: 'Second half of the day is a comp-off (4h); the first half is still worked and logged as usual.',
  CompOffFull: 'A full compensatory day off (8h) — shown as leave, no task hours needed.',
};

// Mirrors DayTypeRequestService.SubmitAsync's earliest-allowed-date check on
// the backend: a month back from today, clamped like .NET's DateOnly.AddMonths
// (e.g. one month back from Mar 31 is Feb 28/29, not Mar 3).
function oneMonthAgo(todayISO: string): string {
  const d = parseISO(todayISO);
  const targetMonthIndex = d.getMonth() - 1;
  const lastDayOfTargetMonth = new Date(d.getFullYear(), targetMonthIndex + 1, 0).getDate();
  const day = Math.min(d.getDate(), lastDayOfTargetMonth);
  return toISO(new Date(d.getFullYear(), targetMonthIndex, day));
}

export function NewRequestDrawer({ onSave, onCancel }: NewRequestDrawerProps) {
  const today = toISO(new Date());
  const earliestDate = oneMonthAgo(today);
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<RequestKind>('WFH');
  const [duration, setDuration] = useState<Duration>('Full');
  const [half, setHalf] = useState<Half>('First');
  const isLeave = LEAVE_PREFIX[kind] !== undefined;
  const requestType = toRequestType(kind, duration, half);
  const [note, setNote] = useState('');
  const [showDateError, setShowDateError] = useState(false);
  const [showNoteError, setShowNoteError] = useState(false);

  function handleSave() {
    if (!date || date < earliestDate) {
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
          min={earliestDate}
          onChange={(e) => { setDate(e.target.value); setShowDateError(false); }}
        />
        {showDateError && <div className={styles.errMsg}>Pick a date within the last month, or a future day.</div>}
      </div>

      <div className={controls.field}>
        <label>Request type <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={kind}
          onChange={(e) => {
            // Every leave kind starts at Full day; Custom starts at First half.
            setKind(e.target.value as RequestKind);
            setDuration('Full');
            setHalf('First');
          }}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      {isLeave && (
        <div className={controls.field}>
          <label>Duration <span className={controls.req}>*</span></label>
          <div className={styles.segBill}>
            <button type="button" className={duration === 'Full' ? styles.on : ''} onClick={() => setDuration('Full')}>
              Full day (8h)
            </button>
            <button type="button" className={duration === 'Custom' ? styles.on : ''} onClick={() => setDuration('Custom')}>
              Custom
            </button>
          </div>
        </div>
      )}

      {isLeave && duration === 'Custom' && (
        <div className={controls.field}>
          <label>Which half <span className={controls.req}>*</span></label>
          <select className={controls.select} value={half} onChange={(e) => setHalf(e.target.value as Half)}>
            <option value="First">First half</option>
            <option value="Second">Second half</option>
          </select>
        </div>
      )}

      <div className={controls.hint} style={{ marginTop: -4, marginBottom: 12 }}>
        {TYPE_HINTS[requestType]}
      </div>

      <div className={controls.field}>
        <label>Note <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={note}
          maxLength={500}
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
