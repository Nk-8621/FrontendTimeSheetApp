import { useState, type ReactNode } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useUI } from '../components/ui/UIProvider';
import {
  useDepartments, useAccounts, useProjects, useModules, useTasks, useHolidays, useProjectTypes, useProjectTypesWithTemplates,
  useMasterDataMutations, useProjectResourceAllocations, useAllocatedEmployees,
} from '../hooks/api/useMasterData';
import {
  useAllEmployees, useSetPrimaryAccount,
  useCreateEmployee, useDeactivateEmployee, useReactivateEmployee,
  useEmployeeProjectAllocations, useSetEmployeeProjectAllocations, useUpdateEmployee,
} from '../hooks/api/useEmployees';
import { ApiError } from '../api/httpClient';
import type { AccountDto, DepartmentDto, EmployeeDto, ProjectDto, ProjectTypeDto, HolidayDto, EmployeeProjectAllocationInput } from '../api/types';
import { useSession } from '../session/SessionContext';
import { StatusPill } from '../components/ui/StatusPill';
import { ACTIVE_STATUS_LABELS, CLASSIFICATION_LABELS } from '../types/meridian';
import { AccountDrawer } from '../components/masterdata/AccountDrawer';
import { DepartmentDrawer } from '../components/masterdata/DepartmentDrawer';
import { ProjectDrawer } from '../components/masterdata/ProjectDrawer';
import { ProjectSetupFlow } from '../components/masterdata/ProjectSetupFlow';
import { ModulesTasksPanel } from '../components/masterdata/ModulesTasksPanel';
import { HolidayDrawer } from '../components/masterdata/HolidayDrawer';
import { EmployeeDrawer } from '../components/masterdata/EmployeeDrawer';
import { ProjectTypeDrawer } from '../components/masterdata/ProjectTypeDrawer';
import { ProjectTypeTemplateDrawer } from '../components/masterdata/ProjectTypeTemplateDrawer';
import { EmployeeAllocationsDrawer } from '../components/masterdata/EmployeeAllocationsDrawer';
import { EmployeeEditDrawer } from '../components/masterdata/EmployeeEditDrawer';
import controls from '../styles/controls.module.css';
import drawerStyles from '../components/timesheet/EntryDrawer.module.css';
import styles from './MasterData.module.css';

type Tab = 'dept' | 'acc' | 'proj' | 'modtask' | 'ptype' | 'res' | 'palloc' | 'hol';
const TABS: [Tab, string][] = [
  ['dept', 'Departments'], ['acc', 'Customers & Internal'], ['proj', 'Projects'],
  ['ptype', 'Project Types'], ['modtask', 'Modules & Task Types'],
  ['res', 'Resources'], ['palloc', 'Resource Allocation'], ['hol', 'Holiday calendar'],
];

/** A tab's table content, wrapped in the wireframe's card + record-count
 * footer — the one shared shell every tab below renders into. */
function RecordsCard({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.tableScroll}>
        <table className={styles.plainTable}>{children}</table>
      </div>
      <div className={styles.gridFoot}>
        <span>{count} record{count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

export function MasterDataPage() {
  const [tab, setTab] = useState<Tab>('dept');
  // One search box, shared by the long list tabs (Customers, Projects,
  // Resources) and cleared on every tab switch.
  const [search, setSearch] = useState('');
  const { openDrawer, closeDrawer, toast } = useUI();
  const { employeeCode: myEmployeeCode } = useSession();

  const departments = useDepartments();
  const accounts = useAccounts();
  const projects = useProjects();
  const modules = useModules();
  const tasks = useTasks();
  const holidays = useHolidays();
  const projectTypes = useProjectTypes();
  // Not in the isLoading/isError arrays below on purpose: it's admin-gated
  // (403 for non-admins), and a non-admin merely viewing this page should
  // still see every other tab fine — only project-type-template mutations
  // are meant to fail for them. Its own loading/error state is handled
  // locally inside the 'ptype' tab render instead.
  const projectTypesWithTemplates = useProjectTypesWithTemplates();
  const employees = useAllEmployees();
  const mutations = useMasterDataMutations();
  const createEmployee = useCreateEmployee();

  const isLoading = [departments, accounts, projects, modules, tasks, holidays, projectTypes, employees].some((q) => q.isLoading);
  const isError = [departments, accounts, projects, modules, tasks, holidays, projectTypes, employees].some((q) => q.isError);

  const deptName = (id: number) => departments.data?.find((d) => d.id === id)?.name ?? '—';
  const accName = (id: number) => accounts.data?.find((a) => a.id === id)?.name ?? '—';
  const projAccount = (accId: number) => accounts.data?.find((a) => a.id === accId);

  // Pickers that assign a person to something new (manager on Add Employee)
  // only offer active employees - a deactivated person can no longer sign in
  // or approve anything.
  const activeEmployees = (employees.data ?? []).filter((e) => e.isActive);
  const employeeById = new Map((employees.data ?? []).map((e) => [e.id, e]));

  const searchText = search.trim().toLowerCase();
  const matches = (...values: (string | null | undefined)[]) =>
    !searchText || values.some((v) => v?.toLowerCase().includes(searchText));
  const filteredAccounts = (accounts.data ?? []).filter((a) => matches(a.name, a.accountType, deptName(a.departmentId)));
  const filteredProjects = (projects.data ?? []).filter((p) =>
    matches(p.code, p.name, accName(p.accountId), p.projectTypeName, p.projectLeadEmployeeName, p.projectManagerEmployeeName));
  const filteredEmployees = (employees.data ?? []).filter((e) =>
    matches(e.fullName, e.employeeCode, e.designation, deptName(e.departmentId), e.managerName));
  const showSearch = tab === 'acc' || tab === 'proj' || tab === 'res';

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function handleAddOrEditDepartment(existing?: DepartmentDto) {
    openDrawer({
      title: existing ? 'Edit department' : 'New department',
      body: (
        <DepartmentDrawer
          existing={existing}
          departments={departments.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateDepartment.mutateAsync({ id: existing.id, body: data })
              : mutations.createDepartment.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Department updated' : 'Department created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this department'));
          }}
        />
      ),
    });
  }

  function handleAddOrEditAccount(existing?: AccountDto) {
    openDrawer({
      title: existing ? 'Edit account' : 'New customer / internal account',
      body: (
        <AccountDrawer
          existing={existing}
          departments={departments.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateAccount.mutateAsync({ id: existing.id, body: data })
              : mutations.createAccount.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Account updated' : 'Account created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this account'));
          }}
        />
      ),
    });
  }

  function handleAddOrEditProject(existing?: ProjectDto) {
    openDrawer({
      title: existing ? 'Edit project' : 'New project',
      body: (
        <ProjectDrawer
          existing={existing}
          departments={departments.data ?? []}
          accounts={accounts.data ?? []}
          projectTypes={projectTypes.data ?? []}
          employees={employees.data ?? []}
          onCancel={closeDrawer}
          onSave={(rows) => {
            if (existing) {
              // Edit is always exactly one row.
              mutations.updateProject.mutateAsync({ id: existing.id, body: rows[0] })
                .then(() => { closeDrawer(); toast('Project updated', 'ok'); })
                .catch((err) => showError(err, 'Could not save this project'));
              return;
            }
            // Create: one row per department/account selected in the drawer -
            // each is its own independent createProject call (no bulk-create
            // API), so report how many actually landed rather than assuming
            // all-or-nothing.
            Promise.allSettled(rows.map((body) => mutations.createProject.mutateAsync(body)))
              .then((results) => {
                const succeeded = results.filter((r) => r.status === 'fulfilled').length;
                const failed = results.length - succeeded;
                if (failed === 0) {
                  closeDrawer();
                  toast(
                    rows.length > 1
                      ? `${succeeded} projects created (one per department) — their module/task trees are now selectable on the grid`
                      : 'Project created — its module/task tree is now selectable on the grid',
                    'ok',
                  );
                } else if (succeeded === 0) {
                  const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
                  showError(firstFailure?.reason, 'Could not save this project');
                } else {
                  closeDrawer();
                  toast(
                    `${succeeded} of ${rows.length} projects created — ${failed} failed (often a duplicate code). Check Master Data > Projects and retry the missing one(s).`,
                    'bad',
                  );
                }
              });
          }}
        />
      ),
    });
  }

  /** "+ New record" on the Projects tab — the guided flow (Customer →
   * Project → Modules → Task Types → Review, all in one panel) is now the
   * default for creating a single project. The old multi-department form
   * (ProjectDrawer's create mode) still creates one Project per checked
   * department in a single pass — a real, distinct capability that isn't
   * being dropped — and stays one click away from inside the guided flow
   * for the admin who specifically needs it. Editing an existing project
   * keeps using ProjectDrawer directly via handleAddOrEditProject below. */
  function handleOpenGuidedProjectSetup() {
    openDrawer({
      title: 'Set up project',
      subtitle: 'Customer, project details, modules and task types — all in one place',
      size: 'wide',
      body: (
        <ProjectSetupFlow
          onDone={closeDrawer}
          onSwitchToClassicForm={() => handleAddOrEditProject()}
        />
      ),
    });
  }

  function handleSyncProjectModules(project: ProjectDto) {
    const confirmed = window.confirm(
      `Pull in any Modules/Tasks from "${project.projectTypeName ?? 'its Project Type'}" that "${project.name}" doesn't already have?\n\n` +
      "This only adds what's missing — it never renames or removes any existing Module/Task, so nothing already logged against them is affected.",
    );
    if (!confirmed) return;
    mutations.syncProjectModuleTemplate.mutate(project.id, {
      onSuccess: () => toast('Modules/Tasks synced from the project type template', 'ok'),
      onError: (err) => showError(err, 'Could not sync this project\'s Modules/Tasks'),
    });
  }

  function handleAddOrEditProjectType(existing?: ProjectTypeDto) {
    openDrawer({
      title: existing ? 'Edit Project Type' : 'New Project Type',
      body: (
        <ProjectTypeDrawer
          existing={existing}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateProjectType.mutateAsync({ id: existing.id, body: data })
              : mutations.createProjectType.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Project Type updated' : 'Project Type created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this Project Type'));
          }}
        />
      ),
    });
  }

  function handleManageTemplates(type: ProjectTypeDto) {
    openDrawer({
      title: `${type.name} — modules & tasks`,
      body: <ProjectTypeTemplateDrawer projectTypeId={type.id} typeName={type.name} onClose={closeDrawer} />,
    });
  }

  /** Reassign-then-delete: try the plain delete first: if the backend
   * reports Projects still reference this type, ask which Project Type to
   * reassign them to and retry with that. */
  function handleDeleteProjectType(type: ProjectTypeDto) {
    if (!window.confirm(`Delete the "${type.name}" Project Type? Its module/task templates go with it.`)) return;

    mutations.deleteProjectType.mutate(
      { id: type.id, body: {} },
      {
        onSuccess: () => toast('Project Type deleted', 'ok'),
        onError: (err) => {
          // Matches MasterDataService.DeleteProjectTypeAsync's message:
          // 'Project Type "X" is still used by N project(s) and M module(s)...'
          if (err instanceof ApiError && /is still used by/i.test(err.message)) {
            promptReplacementAndDelete(type);
          } else {
            showError(err, 'Could not delete this Project Type');
          }
        },
      },
    );
  }

  function promptReplacementAndDelete(type: ProjectTypeDto) {
    const others = (projectTypes.data ?? []).filter((t) => t.id !== type.id);
    openDrawer({
      title: `Reassign projects off "${type.name}"`,
      body: (
        <ReplacementPicker
          typeName={type.name}
          options={others}
          onConfirm={(replacementId) => {
            mutations.deleteProjectType.mutate(
              { id: type.id, body: { replacementProjectTypeId: replacementId } },
              {
                onSuccess: () => { closeDrawer(); toast('Projects reassigned and Project Type deleted', 'ok'); },
                onError: (err) => showError(err, 'Could not delete this Project Type'),
              },
            );
          }}
          onCancel={closeDrawer}
        />
      ),
    });
  }

  function handleAddOrEditHoliday(existing?: HolidayDto) {
    openDrawer({
      title: existing ? 'Edit holiday' : 'New holiday',
      body: (
        <HolidayDrawer
          existing={existing}
          accounts={accounts.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateHoliday.mutateAsync({ id: existing.holidayId, body: { ...data, id: existing.holidayId } })
              : mutations.createHoliday.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Holiday updated' : 'Holiday added', 'ok'); })
              .catch((err) => showError(err, 'Could not save this holiday'));
          }}
          onDelete={existing ? () => {
            mutations.deleteHoliday.mutate(existing.holidayId, {
              onSuccess: () => { closeDrawer(); toast('Holiday removed'); },
              onError: (err) => showError(err, 'Could not remove this holiday'),
            });
          } : undefined}
        />
      ),
    });
  }

  function handleAddEmployee() {
    openDrawer({
      title: 'New employee',
      body: (
        <EmployeeDrawer
          departments={departments.data ?? []}
          employees={activeEmployees}
          projects={projects.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            createEmployee.mutate(data, {
              onSuccess: () => { closeDrawer(); toast('Employee created', 'ok'); },
              onError: (err) => showError(err, 'Could not create this employee'),
            });
          }}
        />
      ),
    });
  }

  function handleEditEmployee(employee: EmployeeDto) {
    openDrawer({
      title: `Edit employee — ${employee.fullName}`,
      body: (
        <EmployeeEditor
          employee={employee}
          departments={departments.data ?? []}
          employees={employees.data ?? []}
          onClose={closeDrawer}
          onShowError={showError}
        />
      ),
    });
  }

  function handleEditAllocations(employee: { employeeCode: string; fullName: string }) {
    openDrawer({
      title: `Projects — ${employee.fullName}`,
      body: (
        <EmployeeAllocationsEditor
          employeeCode={employee.employeeCode}
          employeeName={employee.fullName}
          projects={projects.data ?? []}
          onClose={closeDrawer}
          onShowError={showError}
        />
      ),
    });
  }

  const addHandlers: Record<Tab, (() => void) | null> = {
    dept: () => handleAddOrEditDepartment(),
    acc: () => handleAddOrEditAccount(),
    proj: () => handleOpenGuidedProjectSetup(),
    modtask: null,
    ptype: () => handleAddOrEditProjectType(),
    res: () => handleAddEmployee(),
    palloc: null,
    hol: () => handleAddOrEditHoliday(),
  };

  return (
    <>
      <PageHeader crumb="Setup" title="Master Data">
        {addHandlers[tab] && (
          <button className={`${controls.btn} ${controls.pri} ${controls.sm}`} onClick={addHandlers[tab]!}>+ New record</button>
        )}
      </PageHeader>
      <div className="page-content">
        {isError && <Banner kind="reject">Couldn't load master data — check that the backend API is reachable.</Banner>}

        {!isLoading && !isError && (
          <>
            <div className={styles.tabs}>
              {TABS.map(([key, label]) => (
                <button key={key} className={tab === key ? styles.on : ''} onClick={() => { setTab(key); setSearch(''); }}>{label}</button>
              ))}
            </div>

            {showSearch && (
              <div style={{ marginBottom: 10, maxWidth: 360 }}>
                <input
                  className={controls.textInput}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tab === 'res' ? 'Search by name, code, designation, department…' : tab === 'proj' ? 'Search by code, name, customer, type, lead…' : 'Search by name, type, department…'}
                  aria-label="Search this list"
                />
              </div>
            )}

            {tab === 'dept' && (
              <RecordsCard count={departments.data?.length ?? 0}>
                <thead><tr><th>Code</th><th>Department</th><th>Parent</th><th style={{ textAlign: 'right' }}>Accounts</th><th style={{ textAlign: 'right' }}>Projects</th><th style={{ textAlign: 'right' }}>Resources</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {departments.data?.map((d) => (
                    <tr key={d.id}>
                      <td className="num">{d.code}</td>
                      <td>{d.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{d.parentDepartmentId ? deptName(d.parentDepartmentId) : '—'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{accounts.data?.filter((a) => a.departmentId === d.id).length ?? 0}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{projects.data?.filter((p) => projAccount(p.accountId)?.departmentId === d.id).length ?? 0}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{employees.data?.filter((e) => e.departmentId === d.id).length ?? 0}</td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditDepartment(d)} title="Edit department" aria-label={`Edit department ${d.name}`}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'acc' && (
              <RecordsCard count={filteredAccounts.length}>
                <thead><tr><th>Customer / Internal</th><th>Type</th><th>Department</th><th style={{ textAlign: 'right' }}>Projects</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {filteredAccounts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{a.accountType}</td>
                      <td style={{ color: 'var(--slate)' }}>{deptName(a.departmentId)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{projects.data?.filter((p) => p.accountId === a.id).length ?? 0}</td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditAccount(a)} title="Edit account" aria-label={`Edit account ${a.name}`}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'proj' && (
              <RecordsCard count={filteredProjects.length}>
                <thead><tr><th>Code</th><th>Project</th><th>Customer / Internal</th><th>Project type</th><th>Default type</th><th>Bill type</th><th>Customer PO</th><th>Project lead</th><th>Project manager</th><th style={{ textAlign: 'right' }}>Modules</th><th>Status</th><th style={{ width: 150 }} /><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {filteredProjects.map((p) => (
                    <tr key={p.id}>
                      <td className="num">{p.code}</td>
                      <td>
                        {p.name}
                        {/* Created by an employee via "+ Others" on Add Task Line - still
                            under "Pending Classification" until an admin fixes it up. */}
                        {p.needsReview && (
                          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--amber)', marginTop: 2 }} title="Created by an employee from Add Task Line — assign the real customer, code and billing type, then untick Needs review.">
                            Needs review
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--slate)' }}>{accName(p.accountId)}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectTypeName ?? '—'}</td>
                      <td>{CLASSIFICATION_LABELS[p.defaultBillable]}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.billingType ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.customerPO ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectLeadEmployeeName ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectManagerEmployeeName ?? '—'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{modules.data?.filter((m) => m.projectId === p.id).length ?? 0}</td>
                      <td><StatusPill status={p.isActive ? 'Active' : 'Inactive'} labels={ACTIVE_STATUS_LABELS} /></td>
                      <td>
                        {p.projectTypeId != null && (
                          <button
                            className={`${controls.btn} ${controls.sm}`}
                            disabled={mutations.syncProjectModuleTemplate.isPending}
                            onClick={() => handleSyncProjectModules(p)}
                            title={`Pull in any of ${p.projectTypeName ?? 'this project type'}'s Modules/Tasks this project is missing`}
                          >
                            Sync modules
                          </button>
                        )}
                      </td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditProject(p)} title="Edit project" aria-label={`Edit project ${p.name}`}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'modtask' && (
              <ModulesTasksPanel
                projects={projects.data ?? []}
                modules={modules.data ?? []}
                tasks={tasks.data ?? []}
                mutations={mutations}
              />
            )}

            {tab === 'ptype' && (
              <RecordsCard count={projectTypes.data?.length ?? 0}>
                <thead><tr><th>Name</th><th>Code</th><th style={{ textAlign: 'right' }}>Modules</th><th style={{ textAlign: 'right' }}>Tasks</th><th style={{ textAlign: 'right' }}>Projects using it</th><th style={{ width: 170 }} /></tr></thead>
                <tbody>
                  {projectTypesWithTemplates.isError && (
                    <tr><td colSpan={6} style={{ color: 'var(--clay)', textAlign: 'center', padding: 20 }}>Couldn't load Project Type templates — admin access is required for this tab.</td></tr>
                  )}
                  {projectTypes.data?.map((t) => {
                    const full = projectTypesWithTemplates.data?.find((x) => x.id === t.id);
                    const moduleCount = full?.modules.length ?? 0;
                    const taskCount = full?.modules.reduce((sum, m) => sum + m.tasks.length, 0) ?? 0;
                    const projectCount = projects.data?.filter((p) => p.projectTypeId === t.id).length ?? 0;
                    return (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td className="num" style={{ color: 'var(--slate)' }}>{t.code}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{moduleCount}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{taskCount}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{projectCount}</td>
                        <td style={{ width: 170, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleManageTemplates(t)}>Templates</button>
                          <button className={styles.editBtn} onClick={() => handleAddOrEditProjectType(t)} title="Edit project type" aria-label={`Edit project type ${t.name}`}>✎</button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => handleDeleteProjectType(t)} title="Delete project type" aria-label={`Delete project type ${t.name}`}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'res' && (
              <RecordsCard count={filteredEmployees.length}>
                <thead><tr><th>Resource</th><th>Designation</th><th>Department</th><th>Level 1 approver</th><th>Level 2 approver</th><th>Primary client</th><th>Status</th><th style={{ width: 160 }} /></tr></thead>
                <tbody>
                  {filteredEmployees.map((e) => (
                    <ResourceRow
                      key={e.id}
                      employee={e}
                      employeeById={employeeById}
                      isSelf={e.employeeCode.toLowerCase() === myEmployeeCode.toLowerCase()}
                      deptName={deptName}
                      accounts={accounts.data ?? []}
                      onShowError={showError}
                      onEdit={handleEditEmployee}
                      onEditAllocations={handleEditAllocations}
                    />
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'palloc' && <ResourceAllocationsPanel />}

            {tab === 'hol' && (
              <RecordsCard count={holidays.data?.length ?? 0}>
                <thead><tr><th>Date</th><th>Holiday</th><th>Applies to</th><th>Client</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {holidays.data?.map((h) => (
                    <tr key={h.holidayId}>
                      <td className="num">{new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td>
                      <td>{h.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{h.location}</td>
                      <td style={{ color: 'var(--slate)' }}>{h.accountId ? accName(h.accountId) : 'All clients'}</td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditHoliday(h)} title="Edit holiday" aria-label={`Edit holiday ${h.name}`}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ResourceRow({
  employee, employeeById, isSelf, deptName, accounts, onShowError, onEdit, onEditAllocations,
}: {
  employee: EmployeeDto;
  /** The full employee list, already loaded for this tab - Level 1/Level 2
   * approvers are looked up here instead of two extra API calls per row. */
  employeeById: Map<number, EmployeeDto>;
  /** Hides Deactivate on the signed-in admin's own row (the backend refuses it too). */
  isSelf: boolean;
  deptName: (id: number) => string;
  accounts: AccountDto[];
  onShowError: (err: unknown, fallback: string) => void;
  onEdit: (employee: EmployeeDto) => void;
  onEditAllocations: (employee: { employeeCode: string; fullName: string }) => void;
}) {
  const managerOf = (e: EmployeeDto | undefined) =>
    e && e.managerEmployeeId !== null ? employeeById.get(e.managerEmployeeId) : undefined;
  const manager = managerOf(employee);
  const skipManager = managerOf(manager);
  const setPrimaryAccount = useSetPrimaryAccount();
  const deactivate = useDeactivateEmployee();
  const reactivate = useReactivateEmployee();

  function handleChange(value: string) {
    const accountId = value === '' ? null : Number(value);
    setPrimaryAccount.mutate(
      { employeeCode: employee.employeeCode, accountId },
      { onError: (err) => onShowError(err, "Could not update this resource's primary client") },
    );
  }

  function handleDeactivate() {
    const confirmed = window.confirm(
      `Deactivate ${employee.fullName}? They will no longer be able to sign in, and anyone reporting directly to them will be moved up to ${manager?.fullName ?? 'their manager'}. This does not delete any of their historical timesheet data.`,
    );
    if (!confirmed) return;
    deactivate.mutate(employee.employeeCode, { onError: (err) => onShowError(err, 'Could not deactivate this employee') });
  }

  function handleReactivate() {
    reactivate.mutate(employee.employeeCode, { onError: (err) => onShowError(err, 'Could not reactivate this employee') });
  }

  return (
    <tr style={{ opacity: employee.isActive ? 1 : 0.55 }}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 23, height: 23, borderRadius: '50%', background: 'var(--oxideTint)', color: 'var(--oxide)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700 }}>{employee.initials}</div>
          <b>{employee.fullName}</b>
        </div>
      </td>
      <td style={{ color: 'var(--slate)' }}>{employee.designation}</td>
      <td style={{ color: 'var(--slate)' }}>{deptName(employee.departmentId)}</td>
      <td>{manager?.fullName ?? '—'}</td>
      <td>{skipManager?.fullName ?? '—'}</td>
      <td>
        <select
          className={controls.select}
          value={employee.primaryAccountId ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={setPrimaryAccount.isPending || !employee.isActive}
          style={{ fontSize: 12 }}
        >
          <option value="">No client set</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </td>
      <td><StatusPill status={employee.isActive ? 'Active' : 'Inactive'} labels={ACTIVE_STATUS_LABELS} /></td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className={`${controls.btn} ${controls.sm}`} onClick={() => onEdit(employee)} disabled={!employee.isActive}>
            Edit
          </button>
          <button className={`${controls.btn} ${controls.sm}`} onClick={() => onEditAllocations(employee)}>
            Projects
          </button>
          {isSelf ? null : employee.isActive ? (
            <button className={`${controls.btn} ${controls.sm} ${controls.dgr}`} onClick={handleDeactivate} disabled={deactivate.isPending}>
              Deactivate
            </button>
          ) : (
            <button className={`${controls.btn} ${controls.sm}`} onClick={handleReactivate} disabled={reactivate.isPending}>
              Reactivate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/** Wraps EmployeeEditDrawer with the save mutation it needs - same split as
 * EmployeeAllocationsEditor below, so the drawer itself stays presentational
 * and "Saving…" state stays live (a drawer body is frozen once opened). */
function EmployeeEditor({
  employee, departments, employees, onClose, onShowError,
}: {
  employee: EmployeeDto;
  departments: DepartmentDto[];
  employees: EmployeeDto[];
  onClose: () => void;
  onShowError: (err: unknown, fallback: string) => void;
}) {
  const updateEmployee = useUpdateEmployee();
  const { toast } = useUI();

  return (
    <EmployeeEditDrawer
      employee={employee}
      departments={departments}
      employees={employees}
      isSaving={updateEmployee.isPending}
      onCancel={onClose}
      onSave={(body) => {
        updateEmployee.mutate(
          { employeeCode: employee.employeeCode, body },
          {
            onSuccess: () => { onClose(); toast('Employee updated', 'ok'); },
            onError: (err) => onShowError(err, 'Could not update this employee'),
          },
        );
      }}
    />
  );
}

/** Wraps EmployeeAllocationsDrawer with the data fetch + save mutation it
 * needs — kept out of the drawer component itself so that stays presentational. */
function EmployeeAllocationsEditor({
  employeeCode, employeeName, projects, onClose, onShowError,
}: {
  employeeCode: string;
  employeeName: string;
  projects: ProjectDto[];
  onClose: () => void;
  onShowError: (err: unknown, fallback: string) => void;
}) {
  const { data: currentAllocations, isLoading } = useEmployeeProjectAllocations(employeeCode);
  const setAllocations = useSetEmployeeProjectAllocations();
  const { toast } = useUI();

  function handleSave(allocations: EmployeeProjectAllocationInput[]) {
    setAllocations.mutate(
      { employeeCode, body: { allocations } },
      {
        onSuccess: () => { onClose(); toast('Project allocations updated', 'ok'); },
        onError: (err) => onShowError(err, 'Could not update project allocations'),
      },
    );
  }

  return (
    <EmployeeAllocationsDrawer
      employeeName={employeeName}
      projects={projects}
      currentAllocations={currentAllocations}
      isLoading={isLoading}
      isSaving={setAllocations.isPending}
      onSave={handleSave}
      onCancel={onClose}
    />
  );
}

/** Admin reporting: resource count per project, with a drill-down to the
 * actual allocated employees on demand. Loads independently of the rest of
 * the page (own loading/error state) since it's a separate report query. */
function ResourceAllocationsPanel() {
  const { data, isLoading, isError } = useProjectResourceAllocations();

  if (isLoading) return null;
  if (isError) return <Banner kind="reject">Couldn't load resource allocations — check that you have admin access.</Banner>;

  return (
    <RecordsCard count={data?.length ?? 0}>
      <thead><tr><th>Code</th><th>Project</th><th style={{ textAlign: 'right' }}>Resources</th><th className={styles.editCol} /></tr></thead>
      <tbody>
        {data?.map((row) => <ProjectAllocationRow key={row.projectId} row={row} />)}
      </tbody>
    </RecordsCard>
  );
}

function ProjectAllocationRow({ row }: { row: { projectId: number; projectCode: string; projectName: string; resourceCount: number } }) {
  const [expanded, setExpanded] = useState(false);
  const { data: allocated, isLoading } = useAllocatedEmployees(expanded ? row.projectId : undefined);

  return (
    <>
      <tr>
        <td className="num">{row.projectCode}</td>
        <td>{row.projectName}</td>
        <td className="num" style={{ textAlign: 'right' }}>{row.resourceCount}</td>
        <td className={styles.editCol}>
          <button className={styles.editBtn} onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} employees on ${row.projectName}`}>{expanded ? '▾' : '▸'}</button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} style={{ background: '#FAFBFD', padding: '10px 14px' }}>
            {isLoading && <span style={{ fontSize: 11.5, color: 'var(--slate)' }}>Loading…</span>}
            {allocated && allocated.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--slate)' }}>No employees allocated.</span>}
            {allocated && allocated.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {allocated.map((e) => (
                  <span key={e.employeeId} style={{ fontSize: 12 }}>
                    {e.fullName} <span style={{ color: 'var(--slate)' }}>({e.departmentName})</span>
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** Small drawer body shown when deleting a Project Type that Projects still
 * reference — picks the replacement they all get reassigned to before the
 * delete proceeds (see MasterDataService.DeleteProjectTypeAsync). */
function ReplacementPicker({
  typeName, options, onConfirm, onCancel,
}: {
  typeName: string;
  options: ProjectTypeDto[];
  onConfirm: (replacementId: number) => void;
  onCancel: () => void;
}) {
  const [replacementId, setReplacementId] = useState<number | ''>('');

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 10 }}>
        One or more Projects still use "{typeName}". Pick a Project Type to reassign them to — this only changes
        which type those Projects point to; their existing Modules and Tasks are untouched.
      </div>
      <div className={controls.field}>
        <label>Reassign affected projects to <span className={controls.req}>*</span></label>
        <select className={controls.select} value={replacementId} onChange={(e) => setReplacementId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select a Project Type</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className={drawerStyles.footer}>
        <button
          className={`${controls.btn} ${controls.pri}`}
          disabled={replacementId === ''}
          onClick={() => { if (replacementId !== '') onConfirm(replacementId); }}
        >
          Reassign & delete
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
