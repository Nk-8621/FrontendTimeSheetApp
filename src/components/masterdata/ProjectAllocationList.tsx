import type { EmployeeProjectAllocationInput, ProjectDto, TimeEntryBillingCategory, TimeEntryClassification } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

/** Same vocabulary as BillingClassificationRules on the backend — which
 * categories (if any) are offered once a classification is picked. */
const CATEGORY_OPTIONS: Record<TimeEntryClassification, TimeEntryBillingCategory[]> = {
  Billable: ['AMS', 'T&M', 'FB'],
  NonBillable: ['OH'],
  PartialBillable: [],
};

const CLASSIFICATION_LABEL: Record<TimeEntryClassification, string> = {
  Billable: 'Billable',
  NonBillable: 'Non-billable',
  PartialBillable: 'Partial Billable',
};

/** An allocation is only ready to save once every field the classification
 * requires is actually filled in — Billable/NonBillable need a category,
 * PartialBillable takes none. */
export function allocationIsComplete(a: EmployeeProjectAllocationInput): boolean {
  return CATEGORY_OPTIONS[a.classification].length === 0 || a.billingCategory !== null;
}

interface ProjectAllocationListProps {
  projects: ProjectDto[];
  value: EmployeeProjectAllocationInput[];
  onChange: (next: EmployeeProjectAllocationInput[]) => void;
  maxHeight?: number;
}

/** Checklist of every project — ticking one also requires, mandatorily,
 * picking its Classification and (where applicable) Billing Category right
 * here. This is the admin setting those once at allocation time, instead of
 * the employee choosing them on every timesheet line (see
 * BillingClassificationRules). Shared by the Add Employee form and the
 * Resources tab's "Projects" allocation editor. */
export function ProjectAllocationList({ projects, value, onChange, maxHeight = 280 }: ProjectAllocationListProps) {
  const byProjectId = new Map(value.map((a) => [a.projectId, a]));

  function toggle(projectId: number) {
    if (byProjectId.has(projectId)) {
      onChange(value.filter((a) => a.projectId !== projectId));
    } else {
      onChange([...value, { projectId, classification: 'Billable', billingCategory: null }]);
    }
  }

  function update(projectId: number, patch: Partial<EmployeeProjectAllocationInput>) {
    onChange(value.map((a) => (a.projectId === projectId ? { ...a, ...patch } : a)));
  }

  return (
    <div style={{ maxHeight, overflowY: 'auto', border: '1px solid var(--ruleStrong)', borderRadius: 6, padding: 8 }}>
      {projects.length === 0 && <div className={controls.hint}>No projects exist yet.</div>}
      {projects.map((p) => {
        const allocation = byProjectId.get(p.id);
        const checked = Boolean(allocation);
        const categoryOptions = allocation ? CATEGORY_OPTIONS[allocation.classification] : [];
        return (
          <div key={p.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--rule, #EEF1F6)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} />
              {p.name} <span style={{ color: 'var(--slate)' }}>[{p.code}]</span>
            </label>

            {allocation && (
              <div style={{ marginTop: 6, marginLeft: 22 }}>
                <div className={styles.segBill}>
                  {(Object.keys(CLASSIFICATION_LABEL) as TimeEntryClassification[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={allocation.classification === c ? styles.on : ''}
                      onClick={() => update(p.id, { classification: c, billingCategory: null })}
                    >
                      {CLASSIFICATION_LABEL[c]}
                    </button>
                  ))}
                </div>
                {categoryOptions.length > 0 && (
                  <div className={styles.segCat}>
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={allocation.billingCategory === opt ? styles.on : ''}
                        onClick={() => update(p.id, { billingCategory: opt })}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {!allocationIsComplete(allocation) && (
                  <div className={styles.errMsg}>Pick a billing category for this project.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
