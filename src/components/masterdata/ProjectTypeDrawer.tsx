import { useState } from 'react';
import type { ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectTypeDrawerProps {
  existing?: ProjectTypeDto;
  onSave: (data: { code: string; name: string }) => void;
  onCancel: () => void;
}

/** Create/rename a Project Type. Deletion lives on the Project Types table
 * row instead (see MasterDataPage's handleDeleteProjectType) - reassigning
 * affected Projects/Modules to a replacement type is a bigger decision than
 * fits comfortably inside this edit form. */
export function ProjectTypeDrawer({ existing, onSave, onCancel }: ProjectTypeDrawerProps) {
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are both required.');
      return;
    }
    onSave({ code: code.trim().toUpperCase(), name: name.trim() });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agile Scrum" />
      </div>
      <div className={controls.field}>
        <label>Code <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. AGILE-SCRUM" />
        <div className={controls.hint}>A short unique identifier — not shown to employees, only used internally.</div>
      </div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        Manage this type's Module/Task template from the "Templates" button on the Project Types tab after saving.
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create Project Type'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
