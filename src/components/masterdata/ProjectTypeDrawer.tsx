import { useState } from 'react';
import type { ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectTypeDrawerProps {
  existing?: ProjectTypeDto;
  onSave: (data: { code: string; name: string }) => void;
  onCancel: () => void;
}

export function ProjectTypeDrawer({ existing, onSave, onCancel }: ProjectTypeDrawerProps) {
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are both required.');
      return;
    }
    onSave({ code: code.trim(), name: name.trim() });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agile Scrum" />
      </div>
      <div className={controls.field}>
        <label>Code <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. PT_AGILE_SCRUM" />
        <div className={controls.hint}>A short unique identifier — not shown to employees, only used internally.</div>
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create Project Type'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
