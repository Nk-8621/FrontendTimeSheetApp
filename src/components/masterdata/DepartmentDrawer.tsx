import { useState } from 'react';
import type { DepartmentDto, SaveDepartmentRequest } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface DepartmentDrawerProps {
  existing?: DepartmentDto;
  departments: DepartmentDto[];
  onSave: (data: SaveDepartmentRequest) => void;
  onCancel: () => void;
}

/** Add or edit a department. Departments nest one level deep (e.g. "SAP" >
 * "SAP Technical"), so only top-level departments are offered as a parent.
 * The backend repeats every check here. */
export function DepartmentDrawer({ existing, departments, onSave, onCancel }: DepartmentDrawerProps) {
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [parentId, setParentId] = useState<number | ''>(existing?.parentDepartmentId ?? '');
  const [error, setError] = useState('');

  const hasChildren = existing ? departments.some((d) => d.parentDepartmentId === existing.id) : false;
  const parentOptions = departments.filter((d) => d.parentDepartmentId === null && d.id !== existing?.id);

  function handleSave() {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are both required.');
      return;
    }
    onSave({ code: code.trim().toUpperCase(), name: name.trim(), parentDepartmentId: parentId === '' ? null : parentId });
  }

  return (
    <div>
      <div className={controls.field}>
        <label htmlFor="dept-code">Code <span className={controls.req}>*</span></label>
        <input id="dept-code" className={controls.textInput} type="text" value={code} maxLength={30} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAP_TECHNICAL" />
        <div className={controls.hint}>Short unique code, saved in capitals.</div>
      </div>
      <div className={controls.field}>
        <label htmlFor="dept-name">Department name <span className={controls.req}>*</span></label>
        <input id="dept-name" className={controls.textInput} type="text" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. SAP Technical" />
      </div>
      <div className={controls.field}>
        <label htmlFor="dept-parent">Parent department</label>
        <select id="dept-parent" className={controls.select} value={parentId} disabled={hasChildren} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">None — top-level department</option>
          {parentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {hasChildren && <div className={controls.hint}>This department has sub-departments, so it stays top-level.</div>}
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create department'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
