import { useState, type ReactNode } from 'react';
import type { TimeEntryClassification } from '../../api/types';
import { ApiError } from '../../api/httpClient';
import { useUI } from '../ui/UIProvider';
import {
  useDepartments, useAccounts, useProjectTypes, useModules, useTasks, useMasterDataMutations,
} from '../../hooks/api/useMasterData';
import { useAllEmployees } from '../../hooks/api/useEmployees';
import { ModuleTaskTree } from './ModuleTaskTree';
import controls from '../../styles/controls.module.css';
import drawerStyles from '../timesheet/EntryDrawer.module.css';
import flowStyles from './ProjectSetupFlow.module.css';

const BILLING_TYPES = ['Fixed', 'T&M', 'Consumption', 'NB-ValueAdd', 'NB-L&D', 'NB-Training', 'NB-Travel', 'Others'];
const DEFAULT_BILLABLE_OPTIONS: { value: TimeEntryClassification; label: string }[] = [
  { value: 'Billable', label: 'Billable' },
  { value: 'NonBillable', label: 'Non-billable' },
  { value: 'PartialBillable', label: 'Partial-billable' },
];

type SectionKey = 'customer' | 'project' | 'modules' | 'review';

interface ProjectSetupFlowProps {
  onDone: () => void;
  /** Multi-department creation (one project per checked department in a
   * single pass) is a real, deliberate existing capability — this flow
   * covers the common single-department case end to end; that one stays
   * reachable via the original form rather than being dropped. */
  onSwitchToClassicForm: () => void;
}

/** Guided, single-panel "Set up project" flow: Customer/Internal → Project
 * details → Modules & Task Types → Review, as expandable sections in one
 * wide panel instead of four separate screens. Each section's own "Continue"
 * saves that step for real (there's no new bulk/transactional endpoint —
 * this loops the same single-record create/update calls the rest of the
 * app already uses), so closing the panel partway through never loses
 * already-entered work: the Customer and/or Project simply exist already,
 * and reopening "+ New record" mid-project is out of scope for this pass
 * (use the Projects tab's row to keep going instead).
 *
 * Reads its reference data via hooks directly, not as props — a prop frozen
 * at the moment this panel was opened wouldn't pick up a module/task this
 * same panel just created (see the same reasoning in
 * ProjectTypeTemplateDrawer). */
export function ProjectSetupFlow({ onDone, onSwitchToClassicForm }: ProjectSetupFlowProps) {
  const { toast } = useUI();
  const departments = useDepartments();
  const accounts = useAccounts();
  const projectTypes = useProjectTypes();
  const employees = useAllEmployees();
  const modules = useModules();
  const tasks = useTasks();
  const mutations = useMasterDataMutations();

  const [section, setSection] = useState<SectionKey>('customer');
  const [customerDone, setCustomerDone] = useState(false);
  const [projectDone, setProjectDone] = useState(false);

  // ---- Section 1: Customer / Internal ----
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Customer' | 'Internal'>('Customer');
  const [accountError, setAccountError] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);

  // ---- Section 2: Project details ----
  const [projectId, setProjectId] = useState<number | ''>('');
  // The account id the live Project record actually has, as of its last
  // successful save — separate from `accountId` (the form's current
  // selection) so coming back to Section 1 and picking a different account
  // can be detected as a real change instead of always comparing equal to
  // itself.
  const [savedAccountId, setSavedAccountId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defaultBillable, setDefaultBillable] = useState<TimeEntryClassification>('Billable');
  const [projectTypeId, setProjectTypeId] = useState<number | ''>('');
  const [projectTech, setProjectTech] = useState('');
  const [billingType, setBillingType] = useState('');
  const [customerPO, setCustomerPO] = useState('');
  const [notes, setNotes] = useState('');
  const [projectLeadEmployeeId, setProjectLeadEmployeeId] = useState<number | ''>('');
  const [projectManagerEmployeeId, setProjectManagerEmployeeId] = useState<number | ''>('');
  const [deliveryHeadEmployeeId, setDeliveryHeadEmployeeId] = useState<number | ''>('');
  const [projectError, setProjectError] = useState('');
  const [projectSaving, setProjectSaving] = useState(false);

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  const accountsForDept = departmentId !== '' ? accounts.data?.filter((a) => a.departmentId === departmentId) ?? [] : [];
  const selectedAccount = accountId !== '' ? accounts.data?.find((a) => a.id === accountId) : undefined;
  const selectedDepartment = departmentId !== '' ? departments.data?.find((d) => d.id === departmentId) : undefined;
  const projectModules = projectId !== '' ? modules.data?.filter((m) => m.projectId === projectId) ?? [] : [];
  const projectModuleIds = new Set(projectModules.map((m) => m.id));
  const projectTasks = tasks.data?.filter((t) => projectModuleIds.has(t.moduleId)) ?? [];
  const moduleNameSuggestions = Array.from(new Set((modules.data ?? []).map((m) => m.name))).sort((a, b) => a.localeCompare(b));
  const taskNameSuggestions = Array.from(new Set((tasks.data ?? []).map((t) => t.name))).sort((a, b) => a.localeCompare(b));

  async function handleCreateAccount() {
    const trimmed = accountName.trim();
    if (departmentId === '' || !trimmed) {
      setAccountError('Department and name are both required.');
      return;
    }
    setAccountSaving(true);
    setAccountError('');
    try {
      const created = await mutations.createAccount.mutateAsync({ departmentId, name: trimmed, accountType });
      setAccountId(created.id);
      setAccountCreating(false);
      setAccountName('');
    } catch (err) {
      setAccountError(err instanceof ApiError ? err.message : 'Could not create this customer/internal account');
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleContinueFromCustomer() {
    if (accountId === '') {
      setAccountError('Select an existing account, or create a new one, to continue.');
      return;
    }
    // Project already exists and the admin came back and picked a
    // different account — push the change through the normal update
    // rather than a re-create. If the project doesn't exist yet, there's
    // nothing to save here beyond the selection itself.
    if (projectId !== '' && accountId !== savedAccountId) {
      try {
        await mutations.updateProject.mutateAsync({ id: projectId, body: { accountId } });
        setSavedAccountId(accountId);
      } catch (err) {
        showError(err, 'Could not update this project\'s customer/internal account');
        return;
      }
    }
    setCustomerDone(true);
    setSection('project');
  }

  async function handleContinueFromProject() {
    if (!name.trim() || !code.trim()) {
      setProjectError('Project name and project code are both required.');
      return;
    }
    if (accountId === '') {
      setProjectError('Go back and pick a Customer/Internal account first.');
      return;
    }
    setProjectSaving(true);
    setProjectError('');
    const shared = {
      name: name.trim(),
      defaultBillable,
      projectTech: projectTech.trim() || null,
      billingType: billingType || null,
      customerPO: customerPO.trim() || null,
      notes: notes.trim() || null,
      projectLeadEmployeeId: projectLeadEmployeeId === '' ? null : projectLeadEmployeeId,
      projectManagerEmployeeId: projectManagerEmployeeId === '' ? null : projectManagerEmployeeId,
      deliveryHeadEmployeeId: deliveryHeadEmployeeId === '' ? null : deliveryHeadEmployeeId,
    };
    try {
      if (projectId === '') {
        const created = await mutations.createProject.mutateAsync({
          ...shared,
          accountId,
          code: code.trim().toUpperCase(),
          projectTypeId: projectTypeId === '' ? null : projectTypeId,
        });
        setProjectId(created.id);
        setSavedAccountId(accountId);
      } else {
        await mutations.updateProject.mutateAsync({ id: projectId, body: { ...shared, code: code.trim().toUpperCase() } });
      }
      setProjectDone(true);
      setSection('modules');
    } catch (err) {
      setProjectError(err instanceof ApiError ? err.message : 'Could not save this project — a duplicate project code is the most common cause.');
    } finally {
      setProjectSaving(false);
    }
  }

  function customerSummary() {
    if (!selectedAccount || !selectedDepartment) return '';
    return `${selectedDepartment.name} › ${selectedAccount.name} (${selectedAccount.accountType})`;
  }

  function projectSummary() {
    if (!name) return '';
    return `${name}${code ? ` [${code.toUpperCase()}]` : ''}`;
  }

  return (
    <div>
      {projectId === '' && (
        <div className={flowStyles.classicLink}>
          Setting this same project up for more than one department at once?{' '}
          <button type="button" onClick={onSwitchToClassicForm}>Use the multi-department form instead</button>
        </div>
      )}

      <Section
        index={1}
        title="Customer / Internal"
        summary={customerDone ? customerSummary() : undefined}
        active={section === 'customer'}
        locked={false}
        onExpand={() => setSection('customer')}
      >
        <div className={controls.field}>
          <label>Department <span className={controls.req}>*</span></label>
          <select
            className={controls.select}
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value ? Number(e.target.value) : ''); setAccountId(''); setAccountError(''); }}
          >
            <option value="">Select department</option>
            {(departments.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {accountCreating ? (
          <div className={controls.field}>
            <label>New customer / internal name <span className={controls.req}>*</span></label>
            <input
              className={controls.textInput}
              autoFocus
              value={accountName}
              onChange={(e) => { setAccountName(e.target.value); setAccountError(''); }}
              placeholder="e.g. Neo Metaliks Ltd"
            />
            <div className={drawerStyles.segBill} style={{ marginTop: 8 }}>
              <button type="button" className={accountType === 'Customer' ? drawerStyles.on : ''} onClick={() => setAccountType('Customer')}>Customer</button>
              <button type="button" className={accountType === 'Internal' ? drawerStyles.on : ''} onClick={() => setAccountType('Internal')}>Internal</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className={`${controls.btn} ${controls.pri} ${controls.sm}`} onClick={handleCreateAccount} disabled={accountSaving}>
                {accountSaving ? 'Creating…' : 'Create account'}
              </button>
              <button className={`${controls.btn} ${controls.sm}`} onClick={() => { setAccountCreating(false); setAccountName(''); setAccountError(''); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={controls.field}>
            <label>Customer / Internal <span className={controls.req}>*</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                className={controls.select}
                style={{ flex: 1 }}
                value={accountId}
                disabled={departmentId === ''}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{departmentId !== '' ? 'Select customer or internal' : 'Select a department first'}</option>
                {accountsForDept.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>)}
              </select>
              <button
                type="button"
                className={`${controls.btn} ${controls.sm}`}
                disabled={departmentId === ''}
                onClick={() => { setAccountCreating(true); setAccountError(''); }}
              >
                + Create new
              </button>
            </div>
            {departmentId !== '' && accountsForDept.length === 0 && (
              <div className={controls.hint}>No account exists under this department yet — use "+ Create new" above.</div>
            )}
          </div>
        )}

        {accountError && <div className={drawerStyles.errMsg}>{accountError}</div>}
        <div className={drawerStyles.footer} style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button className={`${controls.btn} ${controls.pri}`} onClick={handleContinueFromCustomer}>Continue</button>
        </div>
      </Section>

      <Section
        index={2}
        title="Project details"
        summary={projectDone ? projectSummary() : undefined}
        active={section === 'project'}
        locked={!customerDone}
        onExpand={() => customerDone && setSection('project')}
      >
        <div className={controls.field}>
          <label>Project name <span className={controls.req}>*</span></label>
          <input className={controls.textInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NML S/4HANA Phase 2" />
        </div>
        <div className={controls.field}>
          <label>Project code <span className={controls.req}>*</span></label>
          <input className={controls.textInput} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. NML-P2" />
        </div>
        <div className={controls.field}>
          <label>Project Tech</label>
          <input className={controls.textInput} value={projectTech} onChange={(e) => setProjectTech(e.target.value)} placeholder="e.g. Digital IOT, Analytics" />
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
          <input className={controls.textInput} value={customerPO} onChange={(e) => setCustomerPO(e.target.value)} placeholder="e.g. PO, Change Request" />
        </div>
        <div className={controls.field}>
          <label>Project Lead</label>
          <select className={controls.select} value={projectLeadEmployeeId} onChange={(e) => setProjectLeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Not set</option>
            {(employees.data ?? []).map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
          </select>
        </div>
        <div className={controls.field}>
          <label>Project Manager</label>
          <select className={controls.select} value={projectManagerEmployeeId} onChange={(e) => setProjectManagerEmployeeId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Not set</option>
            {(employees.data ?? []).map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
          </select>
        </div>
        <div className={controls.field}>
          <label>Delivery Head</label>
          <select className={controls.select} value={deliveryHeadEmployeeId} onChange={(e) => setDeliveryHeadEmployeeId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Not set</option>
            {(employees.data ?? []).map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
          </select>
        </div>
        <div className={controls.field}>
          <label>Notes</label>
          <textarea className={controls.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className={controls.field}>
          <label>Default classification</label>
          <div className={drawerStyles.segBill}>
            {DEFAULT_BILLABLE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" className={defaultBillable === opt.value ? drawerStyles.on : ''} onClick={() => setDefaultBillable(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {projectId === '' && (
          <div className={controls.field}>
            <label>Project Type</label>
            <select className={controls.select} value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">No type — I'll add modules myself next</option>
              {(projectTypes.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className={controls.hint}>
              Auto-generates the starting Module/Task tree from that type's template — you can still add more in the next step. Can't be changed once created.
            </div>
          </div>
        )}

        {projectError && <div className={drawerStyles.errMsg}>{projectError}</div>}
        <div className={drawerStyles.footer} style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button className={`${controls.btn} ${controls.pri}`} onClick={handleContinueFromProject} disabled={projectSaving}>
            {projectSaving ? 'Saving…' : projectId === '' ? 'Create project & continue' : 'Save & continue'}
          </button>
        </div>
      </Section>

      <Section
        index={3}
        title="Modules & Task Types"
        summary={projectModules.length > 0 ? `${projectModules.length} module${projectModules.length !== 1 ? 's' : ''}, ${projectTasks.length} task${projectTasks.length !== 1 ? 's' : ''}` : undefined}
        active={section === 'modules'}
        locked={!projectDone}
        onExpand={() => projectDone && setSection('modules')}
      >
        {projectId !== '' && (
          <>
            <ModuleTaskTree
              projectId={projectId}
              modules={projectModules}
              tasks={projectTasks}
              mutations={mutations}
              moduleNameSuggestions={moduleNameSuggestions}
              taskNameSuggestions={taskNameSuggestions}
              embedded
            />
            <div className={drawerStyles.footer} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button className={`${controls.btn} ${controls.pri}`} onClick={() => setSection('review')}>Continue to review</button>
            </div>
          </>
        )}
      </Section>

      <Section
        index={4}
        title="Review & Finish"
        active={section === 'review'}
        locked={!projectDone}
        onExpand={() => projectDone && setSection('review')}
      >
        <div className={flowStyles.reviewTree}>
          <div><b>Customer:</b> {customerSummary() || '—'}</div>
          <div><b>Project:</b> {projectSummary() || '—'}</div>
          {projectModules.length === 0 && <div className={controls.hint} style={{ marginTop: 6 }}>No modules added yet — go back to the previous section to add some.</div>}
          <ul style={{ marginTop: 6 }}>
            {projectModules.map((m) => (
              <li key={m.id}>
                {m.name}
                <ul>
                  {projectTasks.filter((t) => t.moduleId === m.id).map((t) => <li key={t.id}>{t.name}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div className={controls.hint} style={{ marginBottom: 10 }}>
          Everything above is already saved as you went — Finish just closes this panel. Come back to this project any time from the Projects tab to keep adding modules and tasks.
        </div>
        <div className={drawerStyles.footer} style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button
            className={`${controls.btn} ${controls.ok}`}
            onClick={() => { toast('Project set up', 'ok'); onDone(); }}
          >
            Finish
          </button>
        </div>
      </Section>
    </div>
  );
}

interface SectionProps {
  index: number;
  title: string;
  summary?: string;
  active: boolean;
  locked: boolean;
  onExpand: () => void;
  children: ReactNode;
}

/** One expandable step. Collapses to a one-line summary once its own data
 * has been saved; clicking a completed (or the current) header re-expands
 * it without discarding anything later in the flow. A locked step (its
 * prerequisite hasn't been saved yet) shows but can't be opened. */
function Section({ index, title, summary, active, locked, onExpand, children }: SectionProps) {
  const done = summary !== undefined;
  return (
    <div className={`${flowStyles.section} ${active ? flowStyles.active : ''} ${locked ? flowStyles.locked : ''}`}>
      <button type="button" className={flowStyles.sectionHead} onClick={onExpand} disabled={locked}>
        <span className={`${flowStyles.badge} ${done ? flowStyles.badgeDone : ''}`}>{done ? '✓' : index}</span>
        <span className={flowStyles.sectionTitle}>{title}</span>
        {!active && summary && <span className={flowStyles.sectionSummary}>{summary}</span>}
        <span className={flowStyles.chev}>{active ? '▾' : '▸'}</span>
      </button>
      {active && <div className={flowStyles.sectionBody}>{children}</div>}
    </div>
  );
}
