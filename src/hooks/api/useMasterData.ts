import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../../api/masterData';
import type {
  CreateAccountRequest, UpdateAccountRequest, CreateProjectRequest, UpdateProjectRequest,
  CreateModuleRequest, UpdateModuleRequest, CreateTaskRequest, UpdateTaskRequest,
  CreateHolidayRequest, UpdateHolidayRequest,
  CreateProjectTypeRequest, UpdateProjectTypeRequest, DeleteProjectTypeRequest,
  CreateProjectTypeModuleTemplateRequest, UpdateProjectTypeModuleTemplateRequest,
  CreateProjectTypeTaskTemplateRequest, UpdateProjectTypeTaskTemplateRequest,
  QuickAddProjectRequest, QuickAddModuleRequest, QuickAddTaskRequest,
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

export function useProjectTypes() {
  return useQuery({ queryKey: ['project-types'], queryFn: masterDataApi.getProjectTypes, staleTime: STALE_TIME_MS });
}

/** Admin-only — the full Level-1/Level-2 template tree, for the Project Type
 * management screen. Kept as a separate query from useProjectTypes() (the
 * plain Code/Name list every dropdown uses) since only one screen needs the
 * full tree and it's a heavier fetch. */
export function useProjectTypesWithTemplates() {
  return useQuery({
    queryKey: ['project-types', 'with-templates'],
    queryFn: masterDataApi.getProjectTypesWithTemplates,
    staleTime: STALE_TIME_MS,
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

  // ---- Project Type template management ----
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
    // Reassigning affected Projects to a replacement type changes their
    // ProjectTypeId too, so the Projects list needs a refetch as well.
    onSuccess: () => invalidate('project-types', 'projects'),
  });

  const createModuleTemplate = useMutation({
    mutationFn: (body: CreateProjectTypeModuleTemplateRequest) => masterDataApi.createModuleTemplate(body),
    onSuccess: () => invalidate('project-types'),
  });
  const updateModuleTemplate = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectTypeModuleTemplateRequest }) => masterDataApi.updateModuleTemplate(id, body),
    onSuccess: () => invalidate('project-types'),
  });
  const deleteModuleTemplate = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteModuleTemplate(id),
    onSuccess: () => invalidate('project-types'),
  });

  const createTaskTemplate = useMutation({
    mutationFn: (body: CreateProjectTypeTaskTemplateRequest) => masterDataApi.createTaskTemplate(body),
    onSuccess: () => invalidate('project-types'),
  });
  const updateTaskTemplate = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectTypeTaskTemplateRequest }) => masterDataApi.updateTaskTemplate(id, body),
    onSuccess: () => invalidate('project-types'),
  });
  const deleteTaskTemplate = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteTaskTemplate(id),
    onSuccess: () => invalidate('project-types'),
  });

  return {
    createAccount, updateAccount,
    createProject, updateProject,
    createModule, updateModule,
    createTask, updateTask,
    createHoliday, updateHoliday, deleteHoliday,
    createProjectType, updateProjectType, deleteProjectType,
    createModuleTemplate, updateModuleTemplate, deleteModuleTemplate,
    createTaskTemplate, updateTaskTemplate, deleteTaskTemplate,
  };
}

/** "Others" quick-add — reachable from Add Task Line by any authenticated
 * employee, not just admins. Invalidates the same query keys the admin
 * mutations do, so the newly created record shows up everywhere immediately
 * (including back on the Master Data screen, flagged needsReview). */
export function useQuickAddMutations() {
  const queryClient = useQueryClient();
  const invalidate = (...keys: string[]) => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const quickAddProject = useMutation({
    mutationFn: (body: QuickAddProjectRequest) => masterDataApi.quickAddProject(body),
    onSuccess: () => invalidate('projects'),
  });
  const quickAddModule = useMutation({
    mutationFn: (body: QuickAddModuleRequest) => masterDataApi.quickAddModule(body),
    onSuccess: () => invalidate('modules'),
  });
  const quickAddTask = useMutation({
    mutationFn: (body: QuickAddTaskRequest) => masterDataApi.quickAddTask(body),
    onSuccess: () => invalidate('tasks'),
  });

  return { quickAddProject, quickAddModule, quickAddTask };
}
