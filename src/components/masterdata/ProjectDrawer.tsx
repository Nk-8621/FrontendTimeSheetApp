import { useState } from 'react';
import type { AccountDto, DepartmentDto, ProjectDto, TaskCategoryDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectDrawerProps {
  existing?: ProjectDto;
  departments: DepartmentDto[];
  accounts: AccountDto[];
  taskCategories: TaskCategoryDto[];
  onSave: (data: {
    accountId: number; code: string; name: string; defaultBillable: boolean;
    initialModuleTaskCategoryCode?: string | null; isActive?: boolean;
  }) => void;
  onCancel: () => void;
}

export function ProjectDrawer({ existing, departments, accounts, taskCategories, onSave, onCancel }: ProjectDrawerProps) {
  const existingAccount = existing ? accounts.find((a) => a.id === existing.accountId) : undefined;
  const [departmentId, setDepartmentId] = useState<number | ''>(existingAccount?.departmentId ?? '');
  const [accountId, setAccountId] = useState<number | ''>(existing?.accountId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [code, setCode] = useState(existing?.code ?? '');
  const [billable, setBillable] = useState(existing?.defaultBillable ?? true);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [starterCategory, setStarterCategory] = useState<string>('consult');
  const [addStarterModule, setAddStarterModule] = useState(true);
  const [error, setError] = useState('');

  const accountsForDept = departmentId !== '' ? accounts.filter((a) => a.departmentId === departmentId) : [];

  function handleSave() {
    if (accountId === '' || !name.trim() || !code.trim()) {
      setError('Customer/Internal account, project name, and project code are all required.');
      return;
    }
    onSave({
      accountId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      defaultBillable: billable,
      isActive: existing ? isActive : undefined,
      initialModuleTaskCategoryCode: !existing && addStarterModule ? starterCategory : null,
    });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Department <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value ? Number(e.target.value) : ''); setAccountId(''); }}
        >
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Customer / Internal <span className={controls.req}>*</span></label>
        <select className={controls.select} value={accountId} disabled={departmentId === ''} onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{departmentId !== '' ? 'Select customer or internal' : 'Select a department first'}</option>
          {accountsForDept.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Project name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NML S/4HANA Phase 2" />
      </div>
      <div className={controls.field}>
        <label>Project code <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. NML-P2" />
      </div>
      <div className={controls.field}>
        <label>Default classification</label>
        <div className={styles.segBill}>
          <button className={billable ? styles.on : ''} onClick={() => setBillable(true)}>Billable</button>
          <button className={!billable ? styles.on : ''} onClick={() => setBillable(false)}>Non-billable</button>
        </div>
        <div className={controls.hint}>Applies to new task lines by default. Employees can override per line.</div>
      </div>

      {existing ? (
        <div className={controls.field}>
          <label>Status</label>
          <div className={styles.segBill}>
            <button className={isActive ? styles.on : ''} onClick={() => setIsActive(true)}>Active</button>
            <button className={!isActive ? styles.on : ''} onClick={() => setIsActive(false)}>Inactive</button>
          </div>
          <div className={controls.hint}>Inactive projects stay visible here but drop off the Add Task Line dropdown.</div>
        </div>
      ) : (
        <div className={controls.field}>
          <label>
            <input type="checkbox" checked={addStarterModule} onChange={(e) => setAddStarterModule(e.target.checked)} style={{ marginRight: 6 }} />
            Create a starter "General" module
          </label>
          {addStarterModule && (
            <select className={controls.select} value={starterCategory} onChange={(e) => setStarterCategory(e.target.value)} style={{ marginTop: 6 }}>
              {taskCategories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          )}
          <div className={controls.hint}>Pre-populates a standard task list so the project is usable immediately.</div>
        </div>
      )}

      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create project'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}