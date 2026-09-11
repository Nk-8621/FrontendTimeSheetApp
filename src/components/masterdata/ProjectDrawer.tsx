import { useState } from 'react';
import type { AccountDto, DepartmentDto, EmployeeDto, ProjectDto, ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

const OTHERS_VALUE = '__others__';

interface NewTypeModuleDraft {
  name: string;
  tasks: string[];
  taskDraft: string;
}

interface ProjectDrawerProps {
  existing?: ProjectDto;
  departments: DepartmentDto[];
  accounts: AccountDto[];
  projectTypes: ProjectTypeDto[];
  employees: EmployeeDto[];
  onSave: (data: {
    accountId: number; code: string; name: string; defaultBillable: boolean;
    isActive?: boolean;
    /** Always applied on create. On edit, only takes effect when the
     * project currently has no project type — the backend ignores it
     * otherwise. Mutually exclusive with newProjectType. */
    projectTypeId?: number | null;
    /** Set instead of projectTypeId when the user picked "Others" to define
     * a brand-new Project Type (plus its Modules/Tasks) right from here.
     * The caller is expected to create the Project Type and its templates
     * first, then save the project with the resulting id. */
    newProjectType?: {
      code: string;
      name: string;
      modules: { name: string; tasks: string[] }[];
    };
    projectTech?: string | null;
    billingType?: string | null;
    customerPO?: string | null;
    notes?: string | null;
    needsReview?: boolean;
    projectLeadEmployeeId?: number | null;
    projectManagerEmployeeId?: number | null;
    deliveryHeadEmployeeId?: number | null;
  }) => void;
  onCancel: () => void;
}

export function ProjectDrawer({ existing, departments, accounts, projectTypes, employees, onSave, onCancel }: ProjectDrawerProps) {
  const existingAccount = existing ? accounts.find((a) => a.id === existing.accountId) : undefined;
  const [departmentId, setDepartmentId] = useState<number | ''>(existingAccount?.departmentId ?? '');
  const [accountId, setAccountId] = useState<number | ''>(existing?.accountId ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [code, setCode] = useState(existing?.code ?? '');
  const [billable, setBillable] = useState(existing?.defaultBillable ?? true);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [needsReview, setNeedsReview] = useState(existing?.needsReview ?? false);
  const [projectTypeId, setProjectTypeId] = useState<number | ''>('');
  const [creatingNewType, setCreatingNewType] = useState(false);
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeModules, setNewTypeModules] = useState<NewTypeModuleDraft[]>([]);
  const [newModuleNameInput, setNewModuleNameInput] = useState('');
  const [projectTech, setProjectTech] = useState(existing?.projectTech ?? '');
  const [billingType, setBillingType] = useState(existing?.billingType ?? '');
  const [customerPO, setCustomerPO] = useState(existing?.customerPO ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [projectLeadEmployeeId, setProjectLeadEmployeeId] = useState<number | ''>(existing?.projectLeadEmployeeId ?? '');
  const [projectManagerEmployeeId, setProjectManagerEmployeeId] = useState<number | ''>(existing?.projectManagerEmployeeId ?? '');
  const [deliveryHeadEmployeeId, setDeliveryHeadEmployeeId] = useState<number | ''>(existing?.deliveryHeadEmployeeId ?? '');
  const [error, setError] = useState('');

  const accountsForDept = departmentId !== '' ? accounts.filter((a) => a.departmentId === departmentId) : [];
  // A project's type can be set once - at creation, or later via edit for an
  // older project that was never given one. Once set, it's locked (the
  // backend ignores projectTypeId past that point too).
  const canSetProjectType = !existing || existing.projectTypeId == null;

  function addNewTypeModule() {
    if (!newModuleNameInput.trim()) return;
    setNewTypeModules((prev) => [...prev, { name: newModuleNameInput.trim(), tasks: [], taskDraft: '' }]);
    setNewModuleNameInput('');
  }
  function removeNewTypeModule(idx: number) {
    setNewTypeModules((prev) => prev.filter((_, i) => i !== idx));
  }
  function setModuleTaskDraft(idx: number, value: string) {
    setNewTypeModules((prev) => prev.map((m, i) => (i === idx ? { ...m, taskDraft: value } : m)));
  }
  function addNewTypeTask(idx: number) {
    setNewTypeModules((prev) => prev.map((m, i) => (i === idx && m.taskDraft.trim()
      ? { ...m, tasks: [...m.tasks, m.taskDraft.trim()], taskDraft: '' }
      : m)));
  }
  function removeNewTypeTask(moduleIdx: number, taskIdx: number) {
    setNewTypeModules((prev) => prev.map((m, i) => (i === moduleIdx ? { ...m, tasks: m.tasks.filter((_, j) => j !== taskIdx) } : m)));
  }

  function handleSave() {
    if (accountId === '' || !name.trim() || !code.trim()) {
      setError('Customer/Internal account, project name, and project code are all required.');
      return;
    }
    if (canSetProjectType && creatingNewType && (!newTypeCode.trim() || !newTypeName.trim())) {
      setError('The new project type needs both a code and a name.');
      return;
    }
    onSave({
      accountId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      defaultBillable: billable,
      isActive: existing ? isActive : undefined,
      projectTypeId: canSetProjectType && !creatingNewType ? (projectTypeId === '' ? null : projectTypeId) : undefined,
      newProjectType: canSetProjectType && creatingNewType
        ? {
            code: newTypeCode.trim().toUpperCase(),
            name: newTypeName.trim(),
            modules: newTypeModules.map((m) => ({ name: m.name, tasks: m.tasks })),
          }
        : undefined,
      projectTech: projectTech.trim() || null,
      billingType: billingType.trim() || null,
      customerPO: customerPO.trim() || null,
      notes: notes.trim() || null,
      needsReview: existing ? needsReview : undefined,
      projectLeadEmployeeId: projectLeadEmployeeId === '' ? null : projectLeadEmployeeId,
      projectManagerEmployeeId: projectManagerEmployeeId === '' ? null : projectManagerEmployeeId,
      deliveryHeadEmployeeId: deliveryHeadEmployeeId === '' ? null : deliveryHeadEmployeeId,
    });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Department <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value ? Number(e.target.value) : ''); setAccountId(''); }}
        >
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Customer / Internal <span className={controls.req}>*</span></label>
        <select className={controls.select} value={accountId} disabled={departmentId === ''} onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{departmentId !== '' ? 'Select customer or internal' : 'Select a department first'}</option>
          {accountsForDept.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Project name <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NML S/4HANA Phase 2" />
      </div>
      <div className={controls.field}>
        <label>Project code <span className={controls.req}>*</span></label>
        <input className={controls.textInput} type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. NML-P2" />
      </div>
      <div className={controls.field}>
        <label>Default classification</label>
        <div className={styles.segBill}>
          <button className={billable ? styles.on : ''} onClick={() => setBillable(true)}>Billable</button>
          <button className={!billable ? styles.on : ''} onClick={() => setBillable(false)}>Non-billable</button>
        </div>
        <div className={controls.hint}>Applies to new task lines by default. Employees can override per line.</div>
      </div>

      {canSetProjectType ? (
        <div className={controls.field}>
          <label>Project type</label>
          <select
            className={controls.select}
            value={creatingNewType ? OTHERS_VALUE : projectTypeId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === OTHERS_VALUE) { setCreatingNewType(true); setProjectTypeId(''); }
              else { setCreatingNewType(false); setProjectTypeId(v ? Number(v) : ''); }
            }}
          >
            <option value="">— No project type (empty project) —</option>
            {projectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value={OTHERS_VALUE}>Others — create a new project type…</option>
          </select>
          <div className={controls.hint}>
            {existing
              ? 'This project predates project types and has none yet. Setting one here just classifies it — unlike on creation, it will NOT auto-add Modules/Tasks from that type\'s template. Can\'t be changed again once saved.'
              : 'Pre-populates the project\'s Modules and Tasks from that type\'s standard template so it\'s usable immediately. Can\'t be changed once the project is created.'}
          </div>

          {creatingNewType && (
            <div style={{ marginTop: 10, padding: 10, border: '1px solid var(--rule)', borderRadius: 6 }}>
              <div className={controls.field}>
                <label>New project type code <span className={controls.req}>*</span></label>
                <input className={controls.textInput} type="text" value={newTypeCode} onChange={(e) => setNewTypeCode(e.target.value)} placeholder="e.g. AGILE-SCRUM" />
              </div>
              <div className={controls.field}>
                <label>New project type name <span className={controls.req}>*</span></label>
                <input className={controls.textInput} type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="e.g. Agile Scrum" />
              </div>
              <div className={controls.hint} style={{ marginBottom: 8 }}>
                Optional: add its Modules (L1) and Tasks (L2) now — more can be added later from the Project Types tab too.
              </div>

              {newTypeModules.map((mod, modIdx) => (
                <div key={modIdx} style={{ border: '1px solid var(--rule)', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <b style={{ flex: 1 }}>{mod.name}</b>
                    <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => removeNewTypeModule(modIdx)}>✕</button>
                  </div>
                  <div style={{ paddingLeft: 14 }}>
                    {mod.tasks.map((t, taskIdx) => (
                      <div key={taskIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                        <span style={{ flex: 1, fontSize: 12.5 }}>{t}</span>
                        <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => removeNewTypeTask(modIdx, taskIdx)}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input
                        className={controls.textInput}
                        value={mod.taskDraft}
                        onChange={(e) => setModuleTaskDraft(modIdx, e.target.value)}
                        placeholder="Task name"
                        onKeyDown={(e) => e.key === 'Enter' && addNewTypeTask(modIdx)}
                      />
                      <button className={`${controls.btn} ${controls.sm}`} onClick={() => addNewTypeTask(modIdx)}>+ Add task</button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className={controls.textInput}
                  value={newModuleNameInput}
                  onChange={(e) => setNewModuleNameInput(e.target.value)}
                  placeholder="New module name"
                  onKeyDown={(e) => e.key === 'Enter' && addNewTypeModule()}
                />
                <button className={`${controls.btn} ${controls.sm} ${controls.pri}`} onClick={addNewTypeModule}>+ Add module</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={controls.field}>
          <label>Project type</label>
          <div className={controls.textInput} style={{ color: 'var(--slate)' }}>{existing?.projectTypeName}</div>
          <div className={controls.hint}>Set at creation — can't be changed.</div>
        </div>
      )}

      <div className={controls.field}>
        <label>Project technology</label>
        <input className={controls.textInput} type="text" value={projectTech ?? ''} onChange={(e) => setProjectTech(e.target.value)} placeholder="e.g. SAP S/4HANA" />
      </div>
      <div className={controls.field}>
        <label>Billing type</label>
        <input className={controls.textInput} type="text" value={billingType ?? ''} onChange={(e) => setBillingType(e.target.value)} placeholder="e.g. T&M, Fixed Bid" />
      </div>
      <div className={controls.field}>
        <label>Customer PO</label>
        <input className={controls.textInput} type="text" value={customerPO ?? ''} onChange={(e) => setCustomerPO(e.target.value)} placeholder="e.g. PO-4471" />
      </div>
      <div className={controls.field}>
        <label>Notes</label>
        <textarea className={controls.textarea} value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} placeholder="Any other detail worth recording about this project" />
      </div>

      <div className={controls.field}>
        <label>Project lead</label>
        <select className={controls.select} value={projectLeadEmployeeId} onChange={(e) => setProjectLeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Project manager</label>
        <select className={controls.select} value={projectManagerEmployeeId} onChange={(e) => setProjectManagerEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Delivery head</label>
        <select className={controls.select} value={deliveryHeadEmployeeId} onChange={(e) => setDeliveryHeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>)}
        </select>
      </div>

      {existing ? (
        <>
          <div className={controls.field}>
            <label>Status</label>
            <div className={styles.segBill}>
              <button className={isActive ? styles.on : ''} onClick={() => setIsActive(true)}>Active</button>
              <button className={!isActive ? styles.on : ''} onClick={() => setIsActive(false)}>Inactive</button>
            </div>
            <div className={controls.hint}>Inactive projects stay visible here but drop off the Add Task Line dropdown.</div>
          </div>
          <div className={controls.field}>
            <label>
              <input type="checkbox" checked={needsReview} onChange={(e) => setNeedsReview(e.target.checked)} style={{ marginRight: 6 }} />
              Needs review
            </label>
            <div className={controls.hint}>Flags this project (typically a self-service "Others" quick-add) as still needing proper classification.</div>
          </div>
        </>
      ) : null}

      {error && <div className={styles.errMsg}>{error}</div>}
      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save changes' : 'Create project'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
