import { useEffect, useState } from 'react';
import type { ProjectDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface EmployeeAllocationsDrawerProps {
  employeeName: string;
  projects: ProjectDto[];
  /** Currently-allocated project IDs, once loaded (undefined while loading). */
  currentProjectIds: number[] | undefined;
  isLoading: boolean;
  onSave: (projectIds: number[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/** Pre-ticked checkbox list of every project — the "Edit Employee" allocation
 * editor. There's no general employee-profile edit form on this branch, so
 * this is a dedicated, allocation-only entry point (matching what the
 * backend actually supports: GET/PUT /api/employees/{code}/projects). */
export function EmployeeAllocationsDrawer({
  employeeName, projects, currentProjectIds, isLoading, onSave, onCancel, isSaving,
}: EmployeeAllocationsDrawerProps) {
  const [projectIds, setProjectIds] = useState<number[]>([]);

  useEffect(() => {
    if (currentProjectIds) setProjectIds(currentProjectIds);
  }, [currentProjectIds]);

  function toggleProject(id: number) {
    setProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        Project allocations for <b style={{ color: 'var(--ink)' }}>{employeeName}</b>. Ticking or unticking a
        project here takes effect immediately on save — it doesn't touch any other part of their profile.
      </div>

      {isLoading ? (
        <div className={controls.hint}>Loading current allocations…</div>
      ) : (
        <div className={controls.field}>
          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--ruleStrong)', borderRadius: 6, padding: 8 }}>
            {projects.length === 0 && <div className={controls.hint}>No projects exist yet.</div>}
            {projects.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} />
                {p.name} <span style={{ color: 'var(--slate)' }}>[{p.code}]</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={() => onSave(projectIds)} disabled={isLoading || isSaving}>
          Save allocations
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
