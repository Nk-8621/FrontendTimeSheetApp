import { useState } from 'react';
import type { ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectTypeDrawerProps {
  existing?: ProjectTypeDto;
  otherProjectTypes: ProjectTypeDto[]; // for the "reassign to" picker when deleting
  onSave: (data: { code: string; name: string }) => void;
  onDelete?: (replacementProjectTypeId: number | null) => void;
  onCancel: () => void;
}

export function ProjectTypeDrawer({ existing, otherProjectTypes, onSave, onDelete, onCancel }: ProjectTypeDrawerProps) {
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [replacementId, setReplacementId] = useState<number | ''>('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are both required.');
      return;
    }
    onSave({ code: code.trim().toUpperCase(), name: name.trim() });
  }

  function handleDelete() {
    onDelete?.(replacementId === '' ? null : replacementId);
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Code <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. AGILE-SCRUM" />
      </div>
      <div className={controls.field}>
        <label>Name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agile Scrum" />
      </div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        Manage this type's Module/Task template from the "Manage template" button on the Project Types tab
        after saving.
      </div>

      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create project type'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        {existing && onDelete && !confirmingDelete && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={() => setConfirmingDelete(true)}>Delete</button>
          </>
        )}
      </div>

      {existing && onDelete && confirmingDelete && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule)' }}>
          <div className={controls.field}>
            <label>Reassign existing projects/modules to</label>
            <select className={controls.select} value={replacementId} onChange={(e) => setReplacementId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Don't reassign (delete fails if still in use) —</option>
              {otherProjectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className={controls.hint}>
              Any Project or Module currently on this type is moved to the type picked here before it's
              deleted. Leave unset if you're sure nothing references this type anymore.
            </div>
          </div>
          <div className={styles.footer}>
            <button className={`${controls.btn} ${controls.dgr}`} onClick={handleDelete}>Confirm delete</button>
            <button className={controls.btn} onClick={() => setConfirmingDelete(false)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
