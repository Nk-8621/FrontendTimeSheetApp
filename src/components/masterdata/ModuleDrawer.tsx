import { useState } from 'react';
import type { ModuleDto, ProjectDto, ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ModuleDrawerProps {
  existing?: ModuleDto;
  projects: ProjectDto[];
  projectTypes: ProjectTypeDto[];
  onSave: (data: { projectId: number; name: string; projectTypeId?: number | null }) => void;
  onCancel: () => void;
}

export function ModuleDrawer({ existing, projects, projectTypes, onSave, onCancel }: ModuleDrawerProps) {
  const [projectId, setProjectId] = useState<number | ''>(existing?.projectId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [projectTypeId, setProjectTypeId] = useState<number | ''>(existing?.projectTypeId ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    if (projectId === '' || !name.trim()) {
      setError('Project and module name are both required.');
      return;
    }
    onSave({ projectId, name: name.trim(), projectTypeId: projectTypeId === '' ? null : projectTypeId });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Project <span className={controls.req}>*</span></label>
        <select className={controls.select} value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')} disabled={Boolean(existing)}>
          <option value="">Select project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} [{p.code}]</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Module name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FICO Assessment" />
      </div>
      <div className={controls.field}>
        <label>Project type</label>
        <select className={controls.select} value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">— None —</option>
          {projectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className={controls.hint}>Optional — informs the style of task names typically added under this module.</div>
      </div>
      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create module'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
