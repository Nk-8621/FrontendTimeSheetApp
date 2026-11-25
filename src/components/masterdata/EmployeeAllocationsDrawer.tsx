import { useEffect, useState } from 'react';
import type { EmployeeProjectAllocationDto, EmployeeProjectAllocationInput, ProjectDto } from '../../api/types';
import { ProjectAllocationList, allocationIsComplete } from './ProjectAllocationList';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface EmployeeAllocationsDrawerProps {
  employeeName: string;
  projects: ProjectDto[];
  /** Currently-allocated projects, once loaded (undefined while loading). */
  currentAllocations: EmployeeProjectAllocationDto[] | undefined;
  isLoading: boolean;
  onSave: (allocations: EmployeeProjectAllocationInput[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/** Pre-ticked project checklist, each with its Classification + Billing
 * Category (mandatory together, set by the admin) — the "Edit Employee"
 * allocation editor. There's no general employee-profile edit form on this
 * branch, so this is a dedicated, allocation-only entry point (matching
 * what the backend actually supports: GET/PUT
 * /api/employees/{code}/projects). */
export function EmployeeAllocationsDrawer({
  employeeName, projects, currentAllocations, isLoading, onSave, onCancel, isSaving,
}: EmployeeAllocationsDrawerProps) {
  const [allocations, setAllocations] = useState<EmployeeProjectAllocationInput[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentAllocations) {
      setAllocations(currentAllocations.map((a) => ({
        projectId: a.projectId,
        classification: a.classification,
        billingCategory: a.billingCategory,
      })));
    }
  }, [currentAllocations]);

  function handleSave() {
    if (allocations.some((a) => !allocationIsComplete(a))) {
      setError('Pick a billing category for every allocated project before saving.');
      return;
    }
    setError('');
    onSave(allocations);
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        Project allocations for <b style={{ color: 'var(--ink)' }}>{employeeName}</b>. Ticking a project also
        requires picking its billing classification and category here — the employee no longer picks these when
        logging time. Changes take effect immediately on save.
      </div>

      {isLoading ? (
        <div className={controls.hint}>Loading current allocations…</div>
      ) : (
        <div className={controls.field}>
          <ProjectAllocationList projects={projects} value={allocations} onChange={setAllocations} maxHeight={320} />
        </div>
      )}
      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave} disabled={isLoading || isSaving}>
          Save allocations
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
