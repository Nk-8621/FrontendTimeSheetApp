import { useState } from 'react';
import type { AccountDto, DepartmentDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface AccountDrawerProps {
  existing?: AccountDto;
  departments: DepartmentDto[];
  onSave: (data: { departmentId: number; name: string; accountType: 'Customer' | 'Internal' }) => void;
  onCancel: () => void;
}

export function AccountDrawer({ existing, departments, onSave, onCancel }: AccountDrawerProps) {
  const [departmentId, setDepartmentId] = useState<number | ''>(existing?.departmentId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [accountType, setAccountType] = useState<'Customer' | 'Internal'>(existing?.accountType ?? 'Customer');
  const [error, setError] = useState('');

  function handleSave() {
    if (departmentId === '' || !name.trim()) {
      setError('Department and name are both required.');
      return;
    }
    onSave({ departmentId, name: name.trim(), accountType });
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
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create account'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}