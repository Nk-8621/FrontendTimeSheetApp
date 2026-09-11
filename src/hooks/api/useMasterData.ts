import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../../api/masterData';
import type {
  CreateAccountRequest, UpdateAccountRequest, CreateProjectRequest, UpdateProjectRequest,
  CreateModuleRequest, UpdateModuleRequest, CreateTaskRequest, UpdateTaskRequest,
  CreateHolidayRequest, UpdateHolidayRequest,
  CreateProjectTypeRequest, UpdateProjectTypeRequest, DeleteProjectTypeRequest,
  CreateProjectTypeModuleTemplateRequest, UpdateProjectTypeModuleTemplateRequest,
  CreateProjectTypeTaskTemplateRequest, UpdateProjectTypeTaskTemplateRequest,
} from '../../api/types';

// Reference data changes rarely — cached for 5 minutes so switching screens
// doesn't re-fetch departments/projects/etc. every time.
const STALE_TIME_MS = 5 * 60 * 1000;

export function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: masterDataApi.getDepartments, staleTime: STALE_TIME_MS });
}

export function useLocations() {
  return useQuery({ queryKey: ['locations'], queryFn: masterDataApi.getLocations, staleTime: STALE_TIME_MS });
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: masterDataApi.getAccounts, staleTime: STALE_TIME_MS });
}

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: masterDataApi.getProjects, staleTime: STALE_TIME_MS });
}

export function useModules(projectId?: number) {
  return useQuery({
    queryKey: ['modules', projectId ?? 'all'],
    queryFn: () => masterDataApi.getModules(projectId),
    staleTime: STALE_TIME_MS,
  });
}

export function useTasks(moduleId?: number) {
  return useQuery({
    queryKey: ['tasks', moduleId ?? 'all'],
    queryFn: () => masterDataApi.getTasks(moduleId),
    staleTime: STALE_TIME_MS,
  });
}

export function useHolidays() {
  return useQuery({ queryKey: ['holidays'], queryFn: masterDataApi.getHolidays, staleTime: STALE_TIME_MS });
}

/** Project Types (Level-0) — replaces the old flat useTaskCategories. */
export function useProjectTypes() {
  return useQuery({ queryKey: ['project-types'], queryFn: masterDataApi.getProjectTypes, staleTime: STALE_TIME_MS });
}

/** One Project Type's full Level-1/Level-2 template tree — backs the
 * template-management screen for a single selected Project Type. */
export function useProjectTypeWithTemplate(projectTypeId: number | undefined) {
  return useQuery({
    queryKey: ['project-type', projectTypeId, 'template'],
    queryFn: () => masterDataApi.getProjectTypeWithTemplate(projectTypeId!),
    enabled: Boolean(projectTypeId),
  });
}

/** Every project's current resource count — backs the admin "Resource
 * Allocation" tab. */
export function useProjectResourceAllocations() {
  return useQuery({
    queryKey: ['projects', 'resource-allocations'],
    queryFn: masterDataApi.getProjectResourceAllocations,
    staleTime: 60 * 1000,
  });
}

/** Which employees are allocated to one project — backs that tab's
 * drill-down row. */
export function useAllocatedEmployees(projectId: number | undefined) {
  return useQuery({
    queryKey: ['project', projectId, 'allocated-employees'],
    queryFn: () => masterDataApi.getAllocatedEmployees(projectId!),
    enabled: Boolean(projectId),
  });
}

/** All Master Data admin mutations, bundled together — each invalidates
 * exactly the query keys it can affect. */
export function useMasterDataMutations() {
  const queryClient = useQueryClient();
  const invalidate = (...keys: string[]) => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const createAccount = useMutation({
    mutationFn: (body: CreateAccountRequest) => masterDataApi.createAccount(body),
    onSuccess: () => invalidate('accounts'),
  });
  const updateAccount = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateAccountRequest }) => masterDataApi.updateAccount(id, body),
    onSuccess: () => invalidate('accounts'),
  });

  const createProject = useMutation({
    mutationFn: (body: CreateProjectRequest) => masterDataApi.createProject(body),
    onSuccess: () => invalidate('projects', 'modules', 'tasks'),
  });
  const updateProject = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectRequest }) => masterDataApi.updateProject(id, body),
    onSuccess: () => invalidate('projects'),
  });
  const syncProjectModuleTemplate = useMutation({
    mutationFn: (id: number) => masterDataApi.syncProjectModuleTemplate(id),
    onSuccess: () => invalidate('projects', 'modules', 'tasks'),
  });

  const createModule = useMutation({
    mutationFn: (body: CreateModuleRequest) => masterDataApi.createModule(body),
    onSuccess: () => invalidate('modules'),
  });
  const updateModule = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateModuleRequest }) => masterDataApi.updateModule(id, body),
    onSuccess: () => invalidate('modules'),
  });

  const createTask = useMutation({
    mutationFn: (body: CreateTaskRequest) => masterDataApi.createTask(body),
    onSuccess: () => invalidate('tasks'),
  });
  const updateTask = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTaskRequest }) => masterDataApi.updateTask(id, body),
    onSuccess: () => invalidate('tasks'),
  });

  const createHoliday = useMutation({
    mutationFn: (body: CreateHolidayRequest) => masterDataApi.createHoliday(body),
    onSuccess: () => invalidate('holidays'),
  });
  const updateHoliday = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateHolidayRequest }) => masterDataApi.updateHoliday(id, body),
    onSuccess: () => invalidate('holidays'),
  });
  const deleteHoliday = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteHoliday(id),
    onSuccess: () => invalidate('holidays'),
  });

  // ---- Project Type CRUD ----
  const createProjectType = useMutation({
    mutationFn: (body: CreateProjectTypeRequest) => masterDataApi.createProjectType(body),
    onSuccess: () => invalidate('project-types'),
  });
  const updateProjectType = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectTypeRequest }) => masterDataApi.updateProjectType(id, body),
    onSuccess: () => invalidate('project-types'),
  });
  const deleteProjectType = useMutation({
    mutationFn: ({ id, body }: { id: number; body: DeleteProjectTypeRequest }) => masterDataApi.deleteProjectType(id, body),
    onSuccess: () => invalidate('project-types', 'projects', 'modules'),
  });

  const createModuleTemplate = useMutation({
    mutationFn: (body: CreateProjectTypeModuleTemplateRequest) => masterDataApi.createModuleTemplate(body),
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['project-type', vars.projectTypeId, 'template'] }),
  });
  const updateModuleTemplate = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectTypeModuleTemplateRequest }) =>
      masterDataApi.updateModuleTemplate(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-type'] }),
  });
  const deleteModuleTemplate = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteModuleTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-type'] }),
  });

  const createTaskTemplate = useMutation({
    mutationFn: (body: CreateProjectTypeTaskTemplateRequest) => masterDataApi.createTaskTemplate(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-type'] }),
  });
  const updateTaskTemplate = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectTypeTaskTemplateRequest }) =>
      masterDataApi.updateTaskTemplate(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-type'] }),
  });
  const deleteTaskTemplate = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteTaskTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-type'] }),
  });

  return {
    createAccount, updateAccount,
    createProject, updateProject, syncProjectModuleTemplate,
    createModule, updateModule,
    createTask, updateTask,
    createHoliday, updateHoliday, deleteHoliday,
    createProjectType, updateProjectType, deleteProjectType,
    createModuleTemplate, updateModuleTemplate, deleteModuleTemplate,
    createTaskTemplate, updateTaskTemplate, deleteTaskTemplate,
  };
}
