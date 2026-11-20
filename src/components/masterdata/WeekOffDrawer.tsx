import { useState } from 'react';
import { WEEK_DAY_SHORT } from '../../api/types';
import type { EmployeeWeekOffDto, SaveEmployeeWeekOffRequest, WeekOffOptionsDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

// WEEK OFFS (Nov 2026): add or edit one employee week-off record.

interface WeekOffDrawerProps {
  existing?: EmployeeWeekOffDto;
  options: WeekOffOptionsDto;
  onSave: (body: SaveEmployeeWeekOffRequest) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function WeekOffDrawer({ existing, options, onSave, onDelete, onCancel }: WeekOffDrawerProps) {
  const [employeeCode, setEmployeeCode] = useState(existing?.employeeCode ?? '');
  const [accountId, setAccountId] = useState(existing ? String(existing.accountId) : '');
  const [days, setDays] = useState<string[]>(existing?.weekOffDays ?? []);
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom ?? '');
  const [effectiveTo, setEffectiveTo] = useState(existing?.effectiveTo ?? '');
  const [error, setError] = useState('');

  function toggleDay(day: string) {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
    setError('');
  }

  function handleSave() {
    if (!employeeCode || !accountId || !effectiveFrom) {
      setError('Employee, client and From date are required.');
      return;
    }
    if (days.length === 0) {
      setError('Pick at least one week off day.');
      return;
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      setError("To date can't be before From date.");
      return;
    }
    onSave({
      employeeCode,
      accountId: Number(accountId),
      // Keep Monday-first order, whatever order they were ticked in.
      weekOffDays: WEEK_DAY_SHORT.filter((d) => days.includes(d)),
      effectiveFrom,
      effectiveTo: effectiveTo || null,
    });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Employee <span className={controls.req}>*</span></label>
        <select className={controls.select} value={employeeCode} onChange={(e) => { setEmployeeCode(e.target.value); setError(''); }}>
          <option value="">Select an employee</option>
          {options.employees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className={controls.field}>
        <label>Client <span className={controls.req}>*</span></label>
        <select className={controls.select} value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(''); }}>
          <option value="">Select a client</option>
          {options.clients.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className={controls.field}>
        <label>Week off days <span className={controls.req}>*</span></label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WEEK_DAY_SHORT.map((day) => {
            const on = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={on}
                className={`${controls.btn} ${controls.sm} ${on ? controls.pri : ''}`}
                style={{ minWidth: 46 }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className={controls.hint}>The days this employee is off while working for this client.</div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div className={controls.field} style={{ flex: 1 }}>
          <label>From <span className={controls.req}>*</span></label>
          <input className={controls.textInput} type="date" value={effectiveFrom} onChange={(e) => { setEffectiveFrom(e.target.value); setError(''); }} />
        </div>
        <div className={controls.field} style={{ flex: 1 }}>
          <label>To</label>
          <input className={controls.textInput} type="date" value={effectiveTo} onChange={(e) => { setEffectiveTo(e.target.value); setError(''); }} />
        </div>
      </div>
      <div className={controls.hint} style={{ marginTop: -6, marginBottom: 12 }}>Leave To empty if there is no end date.</div>

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save Changes' : 'Add Week Off'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        {existing && onDelete && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={onDelete}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
