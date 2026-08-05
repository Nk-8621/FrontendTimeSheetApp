import { useState, type ReactNode } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useUI } from '../components/ui/UIProvider';
import {
  useDepartments, useAccounts, useProjects, useModules, useTasks, useHolidays, useTaskCategories, useMasterDataMutations,
} from '../hooks/api/useMasterData';
import { useAllEmployees, useManager, useSkipManager } from '../hooks/api/useEmployees';
import { ApiError } from '../api/httpClient';
import type { AccountDto, ModuleDto, ProjectDto, WorkTaskDto, HolidayDto } from '../api/types';
import { AccountDrawer } from '../components/masterdata/AccountDrawer';
import { ProjectDrawer } from '../components/masterdata/ProjectDrawer';
import { ModuleDrawer } from '../components/masterdata/ModuleDrawer';
import { TaskDrawer } from '../components/masterdata/TaskDrawer';
import { HolidayDrawer } from '../components/masterdata/HolidayDrawer';
import controls from '../styles/controls.module.css';
import styles from './MasterData.module.css';

type Tab = 'dept' | 'acc' | 'proj' | 'mod' | 'task' | 'res' | 'hol';
const TABS: [Tab, string][] = [
  ['dept', 'Departments'], ['acc', 'Customers & Internal'], ['proj', 'Projects'],
  ['mod', 'Modules'], ['task', 'Tasks'], ['res', 'Resources'], ['hol', 'Holiday calendar'],
];

/** A tab's table content, wrapped in the wireframe's card + record-count
 * footer — the one shared shell every tab below renders into. */
function RecordsCard({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className={styles.card}>
      <table className={styles.plainTable}>{children}</table>
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
  const taskCategories = useTaskCategories();
  const employees = useAllEmployees();
  const mutations = useMasterDataMutations();

  const isLoading = [departments, accounts, projects, modules, tasks, holidays, taskCategories, employees].some((q) => q.isLoading);
  const isError = [departments, accounts, projects, modules, tasks, holidays, taskCategories, employees].some((q) => q.isError);

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
          taskCategories={taskCategories.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateProject.mutateAsync({ id: existing.id, body: data })
              : mutations.createProject.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Project updated' : 'Project created with a starter module — it is now selectable on the grid', 'ok'); })
              .catch((err) => showError(err, 'Could not save this project'));
          }}
        />
      ),
    });
  }

  function handleAddOrEditModule(existing?: ModuleDto) {
    openDrawer({
      title: existing ? 'Edit module' : 'New module',
      body: (
        <ModuleDrawer
          existing={existing}
          projects={projects.data ?? []}
          taskCategories={taskCategories.data ?? []}
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateModule.mutateAsync({ id: existing.id, body: { name: data.name, taskCategoryCode: data.taskCategoryCode } })
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
          onCancel={closeDrawer}
          onSave={(data) => {
            const action = existing
              ? mutations.updateHoliday.mutateAsync({ id: existing.id, body: data })
              : mutations.createHoliday.mutateAsync(data);
            action
              .then(() => { closeDrawer(); toast(existing ? 'Holiday updated' : 'Holiday added', 'ok'); })
              .catch((err) => showError(err, 'Could not save this holiday'));
          }}
          onDelete={existing ? () => {
            mutations.deleteHoliday.mutate(existing.id, {
              onSuccess: () => { closeDrawer(); toast('Holiday removed'); },
              onError: (err) => showError(err, 'Could not remove this holiday'),
            });
          } : undefined}
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
    res: null,
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
          code change. Departments, locations, and employee records are sourced from the real org chart and stay
          read-only. Leave is not maintained in Meridian — it is read from Keka and appears on the grid as a
          closed day.
        </Banner>
        {isLoading && <Banner>Loading master data…</Banner>}
        {isError && <Banner kind="reject">Couldn't load master data — check that the backend API is reachable.</Banner>}

        {!isLoading && !isError && (
          <>
            <div className={styles.tabs}>
              {TABS.map(([key, label]) => (
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
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
                <thead><tr><th>Code</th><th>Project</th><th>Customer / Internal</th><th>Default type</th><th style={{ textAlign: 'right' }}>Modules</th><th>Status</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {projects.data?.map((p) => (
                    <tr key={p.id}>
                      <td className="num">{p.code}</td>
                      <td>{p.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{accName(p.accountId)}</td>
                      <td>{p.defaultBillable ? 'Billable' : 'Non-bill'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{modules.data?.filter((m) => m.projectId === p.id).length ?? 0}</td>
                      <td style={{ color: p.isActive ? 'var(--verd)' : 'var(--clay)' }}>{p.isActive ? 'Active' : 'Inactive'}</td>
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

            {tab === 'res' && (
              <RecordsCard count={employees.data?.length ?? 0}>
                <thead><tr><th>Resource</th><th>Designation</th><th>Department</th><th>Level 1 approver</th><th>Level 2 approver</th></tr></thead>
                <tbody>
                  {(employees.data ?? []).map((e) => <ResourceRow key={e.id} employee={e} deptName={deptName} />)}
                </tbody>
              </RecordsCard>
            )}

            {tab === 'hol' && (
              <RecordsCard count={holidays.data?.length ?? 0}>
                <thead><tr><th>Date</th><th>Holiday</th><th>Applies to</th><th className={styles.editCol} /></tr></thead>
                <tbody>
                  {holidays.data?.map((h) => (
                    <tr key={h.id}>
                      <td className="num">{new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td>
                      <td>{h.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{h.location}</td>
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
}

function ResourceRow({ employee, deptName }: { employee: ResourceEmployee; deptName: (id: number) => string }) {
  const { data: manager } = useManager(employee.employeeCode);
  const { data: skipManager } = useSkipManager(employee.employeeCode);
  return (
    <tr>
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
    </tr>
  );
}