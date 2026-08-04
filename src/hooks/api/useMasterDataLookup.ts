import { useDepartments, useAccounts, useProjects, useModules, useTasks } from './useMasterData';

/** One hook that pulls in the full reference-data set and returns both the
 * raw lists (for cascading selects) and byId lookup helpers (for display),
 * so components don't each re-derive the same lookups. */
export function useMasterDataLookup() {
  const departments = useDepartments();
  const accounts = useAccounts();
  const projects = useProjects();
  const modules = useModules();
  const tasks = useTasks();

  const isLoading = departments.isLoading || accounts.isLoading || projects.isLoading || modules.isLoading || tasks.isLoading;

  const deptById = (id: number) => departments.data?.find((d) => d.id === id);
  const accById = (id: number) => accounts.data?.find((a) => a.id === id);
  const projById = (id: number) => projects.data?.find((p) => p.id === id);
  const modById = (id: number) => modules.data?.find((m) => m.id === id);
  const taskById = (id: number) => tasks.data?.find((t) => t.id === id);

  const projAccountId = (projectId: number) => projById(projectId)?.accountId;
  const projDeptId = (projectId: number) => {
    const accountId = projAccountId(projectId);
    return accountId !== undefined ? accById(accountId)?.departmentId : undefined;
  };

  return {
    isLoading,
    departments: departments.data ?? [],
    accounts: accounts.data ?? [],
    projects: projects.data ?? [],
    modules: modules.data ?? [],
    tasks: tasks.data ?? [],
    deptById,
    accById,
    projById,
    modById,
    taskById,
    projAccountId,
    projDeptId,
    deptName: (id: number) => deptById(id)?.name ?? '—',
    accName: (id: number) => accById(id)?.name ?? '—',
    projName: (id: number) => projById(id)?.name ?? '—',
    modName: (id: number) => modById(id)?.name ?? '—',
    taskName: (id: number) => taskById(id)?.name ?? '—',
  };
}
