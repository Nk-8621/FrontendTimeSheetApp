import { useState, type ReactNode } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useUI } from '../components/ui/UIProvider';
import {
  useDepartments, useAccounts, useProjects, useModules, useTasks, useHolidays, useProjectTypes, useMasterDataMutations,
  useProjectResourceAllocations, useAllocatedEmployees,
} from '../hooks/api/useMasterData';
import {
  useAllEmployees, useManager, useSkipManager, useSetPrimaryAccount,
  useCreateEmployee, useDeactivateEmployee, useReactivateEmployee,
  useEmployeeProjectAllocations, useSetEmployeeProjectAllocations,
} from '../hooks/api/useEmployees';
import { ApiError } from '../api/httpClient';
import type { AccountDto, ModuleDto, ProjectDto, ProjectTypeDto, WorkTaskDto, HolidayDto } from '../api/types';
import { AccountDrawer } from '../components/masterdata/AccountDrawer';
import { ProjectDrawer } from '../components/masterdata/ProjectDrawer';
import { ModuleDrawer } from '../components/masterdata/ModuleDrawer';
import { TaskDrawer } from '../components/masterdata/TaskDrawer';
import { HolidayDrawer } from '../components/masterdata/HolidayDrawer';
import { EmployeeDrawer } from '../components/masterdata/EmployeeDrawer';
import { ProjectTypeDrawer } from '../components/masterdata/ProjectTypeDrawer';
import { ProjectTypeTemplateDrawer } from '../components/masterdata/ProjectTypeTemplateDrawer';
import { EmployeeAllocationsDrawer } from '../components/masterdata/EmployeeAllocationsDrawer';
import controls from '../styles/controls.module.css';
import styles from './MasterData.module.css';

type Tab = 'dept' | 'acc' | 'proj' | 'mod' | 'task' | 'ptype' | 'res' | 'palloc' | 'hol';
const TABS: [Tab, string][] = [
  ['dept', 'Departments'], ['acc', 'Customers & Internal'], ['proj', 'Projects'],
  ['mod', 'Modules'], ['task', 'Tasks'], ['ptype', 'Project Types'],
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
  const { openDrawer, closeDrawer, toast } = useUI();

  const departments = useDepartments();
  const accounts = useAccounts();
  const projects = useProjects();
  const modules = useModules();
  const tasks = useTasks();
  const holidays = useHolidays();
  const projectTypes = useProjectTypes();
  const employees = useAllEmployees();
  const mutations = useMasterDataMutations();
  const createEmployee = useCreateEmployee();

  const isLoading = [departments, accounts, projects, modules, tasks, holidays, projectTypes, employees].some((q) => q.isLoading);
  const isError = [departments, accounts, projects, modules, tasks, holidays, projectTypes, employees].some((q) => q.isError);

  const deptName = (id: number) => departments.data?.find((d) => d.id === id)?.name ?? '—';
  const accName = (id: number) => accounts.data?.find((a) => a.id === id)?.name ?? '—';
  const projName = (id: number) => projects.data?.find((p) => p.id === id)?.name ?? '—';
  const modName = (id: number) => modules.data?.find((m) => m.id === id)?.name ?? '—';
  const projAccount = (accId: number) => accounts.data?.find((a) => a.id === accId);

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
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
          onSave={async (data) => {
            const { newProjectType, ...rest } = data;
            let typeCreated = false;
            try {
              let projectTypeId = rest.projectTypeId;
              if (newProjectType) {
                const createdType = await mutations.createProjectType.mutateAsync({
                  code: newProjectType.code, name: newProjectType.name,
                });
                typeCreated = true;
                for (const [modIdx, mod] of newProjectType.modules.entries()) {
                  const createdModule = await mutations.createModuleTemplate.mutateAsync({
                    projectTypeId: createdType.id, name: mod.name, sortOrder: (modIdx + 1) * 10,
                  });
                  for (const [taskIdx, taskName] of mod.tasks.entries()) {
                    await mutations.createTaskTemplate.mutateAsync({
                      projectTypeModuleTemplateId: createdModule.id, name: taskName, sortOrder: (taskIdx + 1) * 10,
                    });
                  }
                }
                projectTypeId = createdType.id;
              }
              const body = { ...rest, projectTypeId };
              if (existing) await mutations.updateProject.mutateAsync({ id: existing.id, body });
              else await mutations.createProject.mutateAsync(body);
              closeDrawer();
              toast(existing ? 'Project updated' : 'Project created', 'ok');
            } catch (err) {
              showError(err, typeCreated
                ? 'Created the new project type, but could not finish saving — check the Project Types tab'
                : 'Could not save this project');
            }
          }}
        />
      ),
    });
  }

  function handleSyncProjectModules(project: ProjectDto) {
    const confirmed = window.confirm(
      `Pull in any Modules/Tasks from "${project.projectTypeName ?? 'its Project Type'}" that "${project.name}" doesn't already have?\n\n` +
      "This only adds what's missing - it never renames or removes any existing Module/Task, so nothing already logged against them is affected.",
    );
    if (!confirmed) return;
    mutations.syncProjectModuleTemplate.mutate(project.id, {
      onSuccess: () => toast('Modules/Tasks synced from the project type template', 'ok'),
      onError: (err) => showError(err, 'Could not sync this project\'s Modules/Tasks'),
    });
  }

  function handleAddOrEditModule(existing?: ModuleDto) {
    openDrawer({
      title: existing ? 'Edit module' : 'New module',
      body: (
        <ModuleDrawer
          existing={existing}
          projects={projects.data ?? []}
          projectTypes={projectTypes.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateModule.mutateAsync({ id: existing.id, body: { name: data.name, projectTypeId: data.projectTypeId } })
              : mutations.createModule.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Module updated' : 'Module created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this module'));
          }}
        />
      ),
    });
  }

  function handleAddOrEditTask(existing?: WorkTaskDto) {
    openDrawer({
      title: existing ? 'Edit task' : 'New task',
      body: (
        <TaskDrawer
          existing={existing}
          modules={modules.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateTask.mutateAsync({ id: existing.id, body: { name: data.name } })
              : mutations.createTask.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Task updated' : 'Task created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this task'));
          }}
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

  function handleAddOrEditProjectType(existing?: ProjectTypeDto) {
    openDrawer({
      title: existing ? 'Edit project type' : 'New project type',
      body: (
        <ProjectTypeDrawer
          existing={existing}
          otherProjectTypes={(projectTypes.data ?? []).filter((t) => t.id !== existing?.id)}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateProjectType.mutateAsync({ id: existing.id, body: data })
              : mutations.createProjectType.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Project type updated' : 'Project type created', 'ok'); })
              .catch((err) => showError(err, 'Could not save this project type'));
          }}
          onDelete={existing ? (replacementProjectTypeId) => {
            mutations.deleteProjectType.mutate(
              { id: existing.id, body: { replacementProjectTypeId } },
              {
                onSuccess: () => { closeDrawer(); toast('Project type removed'); },
                onError: (err) => showError(err, 'Could not remove this project type'),
              },
            );
          } : undefined}
        />
      ),
    });
  }

  function handleManageProjectTypeTemplate(projectType: ProjectTypeDto) {
    openDrawer({
      title: `Template — ${projectType.name}`,
      body: <ProjectTypeTemplateDrawer projectType={projectType} onCancel={closeDrawer} />,
    });
  }

  function handleAddEmployee() {
    openDrawer({
      title: 'New employee',
      body: (
        <EmployeeDrawer
          departments={departments.data ?? []}
          employees={employees.data ?? []}
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
    dept: null,
    acc: () => handleAddOrEditAccount(),
    proj: () => handleAddOrEditProject(),
    mod: () => handleAddOrEditModule(),
    task: () => handleAddOrEditTask(),
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
        <Banner>
          Every level of the hierarchy is maintained here, so a new customer, project, or module never needs a
          code change. Departments and locations are sourced from the real org chart and stay read-only. Leave is
          not maintained in Meridian — it is read from Keka and appears on the grid as a closed day.
        </Banner>
        {isLoading && <Banner>Loading master data…</Banner>}
        {isError && <Banner kind="reject">Couldn't load master data — check that the backend API is reachable.</Banner>}

        {!isLoading && !isError && (
          <>
            <div className={styles.tabs}>
              {TABS.map(([key, label]) => (
                <button key={key} className={tab === key ? styles.on : ''} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            {tab === 'dept' && (
              <RecordsCard count={departments.data?.length ?? 0}>
                <thead><tr><th>Code</th><th>Department</th><th style={{ textAlign: 'right' }}>Accounts</th><th style={{ textAlign: 'right' }}>Projects</th><th style={{ textAlign: 'right' }}>Resources</th></tr></thead>
                <tbody>
                  {departments.data?.map((d) => (
                    <tr key={d.id}>
                      <td className="num">{d.code}</td>
                      <td>{d.name}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{accounts.data?.filter((a) => a.departmentId === d.id).length ?? 0}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{projects.data?.filter((p) => projAccount(p.accountId)?.departmentId === d.id).length ?? 0}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{employees.data?.filter((e) => e.departmentId === d.id).length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'acc' && (
              <RecordsCard count={accounts.data?.length ?? 0}>
                <thead><tr><th>Customer / Internal</th><th>Type</th><th>Department</th><th style={{ textAlign: 'right' }}>Projects</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {accounts.data?.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{a.accountType}</td>
                      <td style={{ color: 'var(--slate)' }}>{deptName(a.departmentId)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{projects.data?.filter((p) => p.accountId === a.id).length ?? 0}</td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditAccount(a)}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'proj' && (
              <RecordsCard count={projects.data?.length ?? 0}>
                <thead><tr><th>Code</th><th>Project</th><th>Customer / Internal</th><th>Project type</th><th>Default type</th><th>Bill type</th><th>Customer PO</th><th>Project lead</th><th>Project manager</th><th style={{ textAlign: 'right' }}>Modules</th><th>Status</th><th style={{ width: 150 }} /><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {projects.data?.map((p) => (
                    <tr key={p.id}>
                      <td className="num">{p.code}</td>
                      <td>{p.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{accName(p.accountId)}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectTypeName ?? '—'}</td>
                      <td>{p.defaultBillable ? 'Billable' : 'Non-bill'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.billingType ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.customerPO ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectLeadEmployeeName ?? '—'}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.projectManagerEmployeeName ?? '—'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{modules.data?.filter((m) => m.projectId === p.id).length ?? 0}</td>
                      <td style={{ color: p.isActive ? 'var(--verd)' : 'var(--clay)' }}>{p.isActive ? 'Active' : 'Inactive'}</td>
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
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditProject(p)}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'mod' && (
              <RecordsCard count={modules.data?.length ?? 0}>
                <thead><tr><th>Module</th><th>Project</th><th style={{ textAlign: 'right' }}>Tasks</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {modules.data?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{projName(m.projectId)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{tasks.data?.filter((t) => t.moduleId === m.id).length ?? 0}</td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditModule(m)}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'task' && (
              <RecordsCard count={tasks.data?.length ?? 0}>
                <thead><tr><th>Task</th><th>Module</th><th>Project</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {tasks.data?.map((t) => {
                    const mod = modules.data?.find((m) => m.id === t.moduleId);
                    return (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td style={{ color: 'var(--slate)' }}>{modName(t.moduleId)}</td>
                        <td style={{ color: 'var(--slate)' }}>{mod ? projName(mod.projectId) : '—'}</td>
                        <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditTask(t)}>✎</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'ptype' && (
              <RecordsCard count={projectTypes.data?.length ?? 0}>
                <thead><tr><th>Code</th><th>Project type</th><th style={{ textAlign: 'right' }}>Projects</th><th style={{ width: 140 }} /><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {projectTypes.data?.map((t) => (
                    <tr key={t.id}>
                      <td className="num">{t.code}</td>
                      <td>{t.name}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{projects.data?.filter((p) => p.projectTypeId === t.id).length ?? 0}</td>
                      <td><button className={`${controls.btn} ${controls.sm}`} onClick={() => handleManageProjectTypeTemplate(t)}>Manage template</button></td>
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditProjectType(t)}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'res' && (
              <RecordsCard count={employees.data?.length ?? 0}>
                <thead><tr><th>Resource</th><th>Designation</th><th>Department</th><th>Level 1 approver</th><th>Level 2 approver</th><th>Primary client</th><th>Status</th><th style={{ width: 160 }} /></tr></thead>
                <tbody>
                  {(employees.data ?? []).map((e) => (
                    <ResourceRow key={e.id} employee={e} deptName={deptName} accounts={accounts.data ?? []} onShowError={showError} onEditAllocations={handleEditAllocations} />
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
                      <td className={styles.editCol}><button className={styles.editBtn} onClick={() => handleAddOrEditHoliday(h)}>✎</button></td>
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

interface ResourceEmployee {
  id: number; employeeCode: string; fullName: string; initials: string; designation: string; departmentId: number;
  primaryAccountId?: number | null; isActive: boolean;
}

function ResourceRow({
  employee, deptName, accounts, onShowError, onEditAllocations,
}: {
  employee: ResourceEmployee;
  deptName: (id: number) => string;
  accounts: AccountDto[];
  onShowError: (err: unknown, fallback: string) => void;
  onEditAllocations: (employee: { employeeCode: string; fullName: string }) => void;
}) {
  const { data: manager } = useManager(employee.employeeCode);
  const { data: skipManager } = useSkipManager(employee.employeeCode);
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
      `Deactivate ${employee.fullName}? Anyone reporting directly to them will be reassigned to their manager's manager. This does not delete any of their historical timesheet data.`,
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
      <td style={{ color: employee.isActive ? 'var(--verd)' : 'var(--clay)', fontWeight: 600, fontSize: 12 }}>
        {employee.isActive ? 'Active' : 'Inactive'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className={`${controls.btn} ${controls.sm}`} onClick={() => onEditAllocations(employee)}>
            Projects
          </button>
          {employee.isActive ? (
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
  const { data: currentProjectIds, isLoading } = useEmployeeProjectAllocations(employeeCode);
  const setAllocations = useSetEmployeeProjectAllocations();
  const { toast } = useUI();

  function handleSave(projectIds: number[]) {
    setAllocations.mutate(
      { employeeCode, body: { projectIds } },
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
      currentProjectIds={currentProjectIds}
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

  if (isLoading) return <Banner>Loading resource allocations…</Banner>;
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
          <button className={styles.editBtn} onClick={() => setExpanded((e) => !e)}>{expanded ? '▾' : '▸'}</button>
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
