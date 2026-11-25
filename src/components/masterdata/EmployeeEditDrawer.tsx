import { useState } from 'react';
import type { DepartmentDto, EmployeeDto, UpdateEmployeeRequest } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface EmployeeEditDrawerProps {
  employee: EmployeeDto;
  departments: DepartmentDto[];
  /** Everyone, so the current manager can be found by id. The picker itself
   * only offers active employees (plus the current manager, if inactive). */
  employees: EmployeeDto[];
  isSaving: boolean;
  onSave: (data: UpdateEmployeeRequest) => void;
  onCancel: () => void;
}

/** Edit an existing employee's basic details (Resources tab › Edit).
 * Employee code and Internal/External are fixed once created, so they're
 * shown read-only. Project allocations have their own "Projects" editor. */
export function EmployeeEditDrawer({ employee, departments, employees, isSaving, onSave, onCancel }: EmployeeEditDrawerProps) {
  const currentManager = employees.find((e) => e.id === employee.managerEmployeeId);

  const [fullName, setFullName] = useState(employee.fullName);
  const [email, setEmail] = useState(employee.email ?? '');
  const [designation, setDesignation] = useState(employee.designation);
  const [departmentId, setDepartmentId] = useState<number | ''>(employee.departmentId);
  const [managerEmployeeCode, setManagerEmployeeCode] = useState(currentManager?.employeeCode ?? '');
  const [error, setError] = useState('');

  // An employee can't manage themselves; the backend also blocks anyone who
  // reports (directly or further down) to this employee.
  const managerOptions = employees.filter(
    (e) => e.id !== employee.id && (e.isActive || e.id === employee.managerEmployeeId),
  );
  const managerChanged = managerEmployeeCode !== (currentManager?.employeeCode ?? '');

  function handleSave() {
    if (!fullName.trim() || !email.trim() || !designation.trim() || departmentId === '' || !managerEmployeeCode) {
      setError('Fill in all required fields.');
      return;
    }
    setError('');
    onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      designation: designation.trim(),
      departmentId,
      managerEmployeeCode,
    });
  }

  return (
    <div>
      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={controls.field}>
        <label>Employee code</label>
        <div className={controls.textInput} style={{ color: 'var(--slate)' }}>{employee.employeeCode}</div>
        <div className={controls.hint}>Can't be changed.</div>
      </div>

      <div className={controls.field}>
        <label htmlFor="edit-employee-name">Full name <span className={controls.req}>*</span></label>
        <input id="edit-employee-name" className={controls.textInput} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className={controls.field}>
        <label htmlFor="edit-employee-email">Email <span className={controls.req}>*</span></label>
        <input id="edit-employee-email" className={controls.textInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className={controls.hint}>Used to link their Microsoft sign-in the first time they log in.</div>
      </div>

      <div className={controls.field}>
        <label htmlFor="edit-employee-designation">Designation <span className={controls.req}>*</span></label>
        <input id="edit-employee-designation" className={controls.textInput} type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} />
      </div>

      <div className={controls.field}>
        <label htmlFor="edit-employee-department">Department <span className={controls.req}>*</span></label>
        <select
          id="edit-employee-department"
          className={controls.select}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className={controls.field}>
        <label htmlFor="edit-employee-manager">Manager <span className={controls.req}>*</span></label>
        <select
          id="edit-employee-manager"
          className={controls.select}
          value={managerEmployeeCode}
          onChange={(e) => setManagerEmployeeCode(e.target.value)}
        >
          <option value="">Select manager</option>
          {managerOptions.map((e) => (
            <option key={e.employeeCode} value={e.employeeCode}>
              {e.fullName} ({e.employeeCode}){e.isActive ? '' : ' — inactive'}
            </option>
          ))}
        </select>
        <div className={controls.hint}>
          {managerChanged
            ? 'Takes effect immediately — including weeks this employee has already submitted that are still waiting for approval.'
            : 'The manager approves their timesheets at Level 1.'}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
