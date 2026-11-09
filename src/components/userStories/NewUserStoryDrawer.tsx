import { useState } from 'react';
import { useEmployeeProjectAllocations } from '../../hooks/api/useEmployees';
import { useMasterDataLookup } from '../../hooks/api/useMasterDataLookup';
import { useCreateUserStory } from '../../hooks/api/useUserStories';
import { ApiError } from '../../api/httpClient';
import type { UserStoryDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from './UserStories.module.css';

interface NewUserStoryDrawerProps {
  employeeCode: string;
  onCreated: (story: UserStoryDto) => void;
  onCancel: () => void;
}

/** Create a user story: just a name and the project it belongs to. */
export function NewUserStoryDrawer({ employeeCode, onCreated, onCancel }: NewUserStoryDrawerProps) {
  const { data: allocations } = useEmployeeProjectAllocations(employeeCode);
  const { projById } = useMasterDataLookup();
  const createStory = useCreateUserStory(employeeCode);

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState('');

  // Same projects Add Task Line offers: the ones you're allocated to that are still active.
  const projects = (allocations ?? []).filter((a) => projById(a.projectId)?.isActive !== false);

  function handleCreate() {
    if (!name.trim() || projectId === '') {
      setShowErrors(true);
      return;
    }
    createStory.mutate(
      { name: name.trim(), projectId },
      {
        onSuccess: (story) => onCreated(story),
        onError: (err) => setServerError(err instanceof ApiError ? err.message : 'Could not create the user story'),
      },
    );
  }

  return (
    <div>
      <div className={controls.field}>
        <label htmlFor="storyName">User story name <span className={controls.req}>*</span></label>
        <input
          id="storyName"
          className={controls.textInput}
          autoFocus
          maxLength={200}
          value={name}
          placeholder="e.g. Employee management module"
          onChange={(e) => { setName(e.target.value); setServerError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
        />
        {showErrors && !name.trim() && <div className={styles.errMsg}>Enter a user story name.</div>}
      </div>

      <div className={controls.field}>
        <label htmlFor="storyProject">Project <span className={controls.req}>*</span></label>
        <select
          id="storyProject"
          className={controls.select}
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value ? Number(e.target.value) : ''); setServerError(''); }}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
          ))}
        </select>
        {showErrors && projectId === '' && <div className={styles.errMsg}>Select the project this story belongs to.</div>}
        <div className={controls.hint}>
          {projects.length === 0 ? "You aren't allocated to any projects yet - ask your admin." : 'Only projects you are allocated to.'}
        </div>
      </div>

      {serverError && <div className={styles.errMsg}>{serverError}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleCreate} disabled={createStory.isPending}>
          {createStory.isPending ? 'Creating…' : 'Create user story'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
