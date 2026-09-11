import { useState } from 'react';
import type { AccountDto, DepartmentDto, EmployeeDto, ProjectDto, ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

/** Fixed, T&M, Consumption, NB-ValueAdd, NB-L&D, NB-Training, NB-Travel, Others
 * — mirrors MasterDataService.AllowedBillingTypes on the backend (enforced
 * there, not by a DB constraint — keep the two lists in sync by hand). */
const BILLING_TYPES = ['Fixed', 'T&M', 'Consumption', 'NB-ValueAdd', 'NB-L&D', 'NB-Training', 'NB-Travel', 'Others'];

interface ProjectDrawerProps {
  existing?: ProjectDto;
  departments: DepartmentDto[];
  accounts: AccountDto[];
  projectTypes: ProjectTypeDto[];
  employees: EmployeeDto[];
  onSave: (data: {
    accountId: number; code: string; name: string; defaultBillable: boolean;
    isActive?: boolean;
    /** Applied on create, or on edit only when the project currently has no
     * project type yet (retroactive classification) — the backend ignores
     * it otherwise, and once set it can never be changed again. */
    projectTypeId?: number | null;
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

/** Project Type is set once — either at creation, or later via edit for an
 * older project that predates project types. Once set it's locked (the
 * backend ignores projectTypeId past that point too), so this drawer never
 * offers the "create a brand-new Project Type from here" flow — that lives
 * on the Project Types tab, where a type is set up once and then just picked
 * from a plain dropdown here. */
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
  const [projectTech, setProjectTech] = useState(existing?.projectTech ?? '');
  const [billingType, setBillingType] = useState(existing?.billingType ?? '');
  const [customerPO, setCustomerPO] = useState(existing?.customerPO ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [projectLeadEmployeeId, setProjectLeadEmployeeId] = useState<number | ''>(existing?.projectLeadEmployeeId ?? '');
  const [projectManagerEmployeeId, setProjectManagerEmployeeId] = useState<number | ''>(existing?.projectManagerEmployeeId ?? '');
  const [deliveryHeadEmployeeId, setDeliveryHeadEmployeeId] = useState<number | ''>(existing?.deliveryHeadEmployeeId ?? '');
  const [error, setError] = useState('');

  const accountsForDept = departmentId !== '' ? accounts.filter((a) => a.departmentId === departmentId) : [];
  const canSetProjectType = !existing || existing.projectTypeId == null;

  function handleSave() {
    if (accountId === '' || !name.trim() || !code.trim()) {
      setError('Customer/Internal account, project name, and project code are all required.');
      return;
    }
    onSave({
      accountId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      defaultBillable: billable,
      isActive: existing ? isActive : undefined,
      projectTypeId: canSetProjectType ? (projectTypeId === '' ? null : projectTypeId) : undefined,
      projectTech: projectTech.trim() || null,
      billingType: billingType || null,
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
        <label>Project Tech</label>
        <input className={controls.textInput} type="text" value={projectTech} onChange={(e) => setProjectTech(e.target.value)} placeholder="e.g. Digital IOT, Analytics, SAP Staffing" />
      </div>
      <div className={controls.field}>
        <label>Billing Type</label>
        <select className={controls.select} value={billingType} onChange={(e) => setBillingType(e.target.value)}>
          <option value="">Not set</option>
          {BILLING_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Customer PO</label>
        <input className={controls.textInput} type="text" value={customerPO} onChange={(e) => setCustomerPO(e.target.value)} placeholder="e.g. PO, Change Request" />
      </div>

      <div className={controls.field}>
        <label>Project Lead</label>
        <select className={controls.select} value={projectLeadEmployeeId} onChange={(e) => setProjectLeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Project Manager</label>
        <select className={controls.select} value={projectManagerEmployeeId} onChange={(e) => setProjectManagerEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
        </select>
      </div>
      <div className={controls.field}>
        <label>Delivery Head</label>
        <select className={controls.select} value={deliveryHeadEmployeeId} onChange={(e) => setDeliveryHeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Not set</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
        </select>
      </div>

      <div className={controls.field}>
        <label>Notes</label>
        <textarea className={controls.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Started Jan 2024" />
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
          <label>Project Type</label>
          <select className={controls.select} value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">No type — empty project, add modules manually</option>
            {projectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className={controls.hint}>
            {existing
              ? "This project predates project types and has none yet. Setting one here just classifies it — unlike on creation, it will NOT auto-add Modules/Tasks from that type's template. Can't be changed again once saved."
              : "Auto-generates the full Module/Task tree from that type's template, so the project is usable immediately. Can't be changed once the project is created. Manage the templates themselves on the Project Types tab."}
          </div>
        </div>
      ) : (
        <div className={controls.field}>
          <label>Project Type</label>
          <div className={controls.textInput} style={{ color: 'var(--slate)' }}>{existing?.projectTypeName}</div>
          <div className={controls.hint}>Set once — can't be changed.</div>
        </div>
      )}

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
