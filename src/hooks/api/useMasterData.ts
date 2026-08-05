import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../../api/masterData';
import type {
  CreateAccountRequest, UpdateAccountRequest, CreateProjectRequest, UpdateProjectRequest,
  CreateModuleRequest, UpdateModuleRequest, CreateTaskRequest, UpdateTaskRequest,
  CreateHolidayRequest, UpdateHolidayRequest,
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

export function useTaskCategories() {
  return useQuery({ queryKey: ['task-categories'], queryFn: masterDataApi.getTaskCategories, staleTime: STALE_TIME_MS });
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

  return {
    createAccount, updateAccount,
    createProject, updateProject,
    createModule, updateModule,
    createTask, updateTask,
    createHoliday, updateHoliday, deleteHoliday,
  };
}