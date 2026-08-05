import { useState } from 'react';
import type { HolidayDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface HolidayDrawerProps {
  existing?: HolidayDto;
  onSave: (data: { holidayDate: string; name: string; location: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function HolidayDrawer({ existing, onSave, onDelete, onCancel }: HolidayDrawerProps) {
  const [date, setDate] = useState(existing?.date ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [location, setLocation] = useState(existing?.location ?? 'All India');
  const [error, setError] = useState('');

  function handleSave() {
    if (!date || !name.trim() || !location.trim()) {
      setError('Date, name, and location are all required.');
      return;
    }
    onSave({ holidayDate: date, name: name.trim(), location: location.trim() });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Date <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className={controls.field}>
        <label>Holiday name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali" />
      </div>
      <div className={controls.field}>
        <label>Applies to <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. All India, or Hyderabad" />
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Add holiday'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        {existing && onDelete && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={onDelete}>Remove</button>
          </>
        )}
      </div>
    </div>
  );
}