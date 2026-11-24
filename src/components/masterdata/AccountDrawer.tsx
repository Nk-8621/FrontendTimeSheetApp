import { useState } from 'react';
import { WEEK_DAY_SHORT } from '../../api/types';
import type { AccountDto, DepartmentDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface AccountDrawerProps {
  existing?: AccountDto;
  departments: DepartmentDto[];
  onSave: (data: { departmentId: number; name: string; accountType: 'Customer' | 'Internal'; weekOffDays: string[] }) => void;
  onCancel: () => void;
}

export function AccountDrawer({ existing, departments, onSave, onCancel }: AccountDrawerProps) {
  const [departmentId, setDepartmentId] = useState<number | ''>(existing?.departmentId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [accountType, setAccountType] = useState<'Customer' | 'Internal'>(existing?.accountType ?? 'Customer');
  // CLIENT WEEK OFF (Nov 2026): the client's default week off - Sat, Sun for a new one.
  const [weekOffDays, setWeekOffDays] = useState<string[]>(existing?.weekOffDays ?? ['Sat', 'Sun']);
  const [error, setError] = useState('');

  function toggleDay(day: string) {
    setWeekOffDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  }

  function handleSave() {
    if (departmentId === '' || !name.trim()) {
      setError('Department and name are both required.');
      return;
    }
    if (weekOffDays.length === 0) { setError('Pick at least one week off day.'); return; }
    if (weekOffDays.length > 3) { setError('At most 3 week off days can be set.'); return; }
    onSave({ departmentId, name: name.trim(), accountType, weekOffDays: WEEK_DAY_SHORT.filter((d) => weekOffDays.includes(d)) });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Department <span className={controls.req}>*</span></label>
        <select className={controls.select} value={departmentId} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Customer / Internal name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Neo Metaliks Ltd" />
      </div>
      <div className={controls.field}>
        <label>Type</label>
        <div className={styles.segBill}>
          <button className={accountType === 'Customer' ? styles.on : ''} onClick={() => setAccountType('Customer')}>Customer</button>
          <button className={accountType === 'Internal' ? styles.on : ''} onClick={() => setAccountType('Internal')}>Internal</button>
        </div>
      </div>
      <div className={controls.field}>
        <label>Week Off Days <span className={controls.req}>*</span></label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WEEK_DAY_SHORT.map((day) => {
            const on = weekOffDays.includes(day);
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
        <div className={controls.hint}>
          Default week off for employees whose primary client is this one. For some employees on different days, use Custom WeekOffs.
        </div>
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create account'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}