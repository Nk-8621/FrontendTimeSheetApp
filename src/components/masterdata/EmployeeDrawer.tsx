import { useState } from 'react';
import type { DepartmentDto, EmployeeDto, ProjectDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface EmployeeDrawerProps {
  departments: DepartmentDto[];
  employees: EmployeeDto[]; // populates the manager picker
  projects: ProjectDto[]; // populates the initial-allocation checkbox list
  onSave: (data: {
    fullName: string;
    email: string;
    designation: string;
    managerEmployeeCode: string;
    departmentId: number;
    isExternal: boolean;
    employeeCode: string | null;
    projectIds: number[];
  }) => void;
  onCancel: () => void;
}

export function EmployeeDrawer({ departments, employees, projects, onSave, onCancel }: EmployeeDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [managerEmployeeCode, setManagerEmployeeCode] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [isExternal, setIsExternal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [projectIds, setProjectIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  function toggleProject(id: number) {
    setProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function handleSave() {
    if (!fullName.trim() || !email.trim() || !designation.trim() || !managerEmployeeCode || !departmentId) {
      setError('Fill in all required fields.');
      return;
    }
    if (!isExternal && !employeeCode.trim()) {
      setError('Employee code is required for internal employees.');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      designation: designation.trim(),
      managerEmployeeCode,
      departmentId: Number(departmentId),
      isExternal,
      employeeCode: isExternal ? null : employeeCode.trim(),
      projectIds,
    });
  }

  return (
    <div>
      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={controls.field}>
        <label>Employee type <span className={controls.req}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`${controls.btn} ${!isExternal ? controls.pri : ''}`}
            onClick={() => setIsExternal(false)}
          >
            Internal
          </button>
          <button
            type="button"
            className={`${controls.btn} ${isExternal ? controls.pri : ''}`}
            onClick={() => setIsExternal(true)}
          >
            External
          </button>
        </div>
        <div className={controls.hint}>
          {isExternal
            ? 'A login code (EXT####) is generated automatically - they log in with email instead.'
            : 'Enter the real employee code assigned by HR.'}
        </div>
      </div>

      {!isExternal && (
        <div className={controls.field}>
          <label>Employee code <span className={controls.req}>*</span></label>
          <input
            className={controls.textInput}
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="e.g. CBT1350"
          />
        </div>
      )}

      <div className={controls.field}>
        <label>Full name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className={controls.field}>
        <label>Email <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@carbynetech.com" />
      </div>

      <div className={controls.field}>
        <label>Designation <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Trainee Software Associate" />
      </div>

      <div className={controls.field}>
        <label>Department <span className={controls.req}>*</span></label>
        <select className={controls.select} value={departmentId} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className={controls.field}>
        <label>Manager <span className={controls.req}>*</span></label>
        <select className={controls.select} value={managerEmployeeCode} onChange={(e) => setManagerEmployeeCode(e.target.value)}>
          <option value="">Select manager</option>
          {employees.map((emp) => (
            <option key={emp.employeeCode} value={emp.employeeCode}>{emp.fullName} ({emp.employeeCode})</option>
          ))}
        </select>
        <div className={controls.hint}>This determines who approves their timesheets at Level 1.</div>
      </div>

      <div className={controls.field}>
        <label>Allocate to projects</label>
        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--ruleStrong)', borderRadius: 6, padding: 8 }}>
          {projects.length === 0 && <div className={controls.hint}>No projects to allocate yet.</div>}
          {projects.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} />
              {p.name} <span style={{ color: 'var(--slate)' }}>[{p.code}]</span>
            </label>
          ))}
        </div>
        <div className={controls.hint}>Optional — more projects can always be added later from the Resources tab.</div>
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>Create employee</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
