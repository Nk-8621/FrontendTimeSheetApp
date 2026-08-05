import { useState } from 'react';
import type { ModuleDto, WorkTaskDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface TaskDrawerProps {
  existing?: WorkTaskDto;
  modules: ModuleDto[];
  onSave: (data: { moduleId: number; name: string }) => void;
  onCancel: () => void;
}

export function TaskDrawer({ existing, modules, onSave, onCancel }: TaskDrawerProps) {
  const [moduleId, setModuleId] = useState<number | ''>(existing?.moduleId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    if (moduleId === '' || !name.trim()) {
      setError('Module and task name are both required.');
      return;
    }
    onSave({ moduleId, name: name.trim() });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Module <span className={controls.req}>*</span></label>
        <select className={controls.select} value={moduleId} onChange={(e) => setModuleId(e.target.value ? Number(e.target.value) : '')} disabled={Boolean(existing)}>
          <option value="">Select module</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Task name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Requirement Gathering" />
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create task'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}