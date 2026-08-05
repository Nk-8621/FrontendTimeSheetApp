import { http } from './httpClient';
import type {
  AccountDto, CreateAccountRequest, UpdateAccountRequest,
  CreateHolidayRequest, UpdateHolidayRequest, HolidayDto,
  CreateModuleRequest, UpdateModuleRequest,
  CreateProjectRequest, UpdateProjectRequest,
  CreateTaskRequest, UpdateTaskRequest,
  DepartmentDto, LocationDto, ModuleDto, ProjectDto, TaskCategoryDto, WorkTaskDto,
} from './types';

export const masterDataApi = {
  // ---- Reads ----
  getDepartments: () => http.get<DepartmentDto[]>('/api/masterdata/departments'),
  getLocations: () => http.get<LocationDto[]>('/api/masterdata/locations'),
  getAccounts: () => http.get<AccountDto[]>('/api/masterdata/accounts'),
  getProjects: () => http.get<ProjectDto[]>('/api/masterdata/projects'),
  getModules: (projectId?: number) =>
    http.get<ModuleDto[]>(`/api/masterdata/modules${projectId ? `?projectId=${projectId}` : ''}`),
  getTasks: (moduleId?: number) =>
    http.get<WorkTaskDto[]>(`/api/masterdata/tasks${moduleId ? `?moduleId=${moduleId}` : ''}`),
  getHolidays: () => http.get<HolidayDto[]>('/api/masterdata/holidays'),
  getTaskCategories: () => http.get<TaskCategoryDto[]>('/api/masterdata/task-categories'),

  // ---- Mutations (Admin only — backend enforces this regardless) ----
  createAccount: (body: CreateAccountRequest) => http.post<AccountDto>('/api/masterdata/accounts', body),
  updateAccount: (id: number, body: UpdateAccountRequest) => http.put<AccountDto>(`/api/masterdata/accounts/${id}`, body),

  createProject: (body: CreateProjectRequest) => http.post<ProjectDto>('/api/masterdata/projects', body),
  updateProject: (id: number, body: UpdateProjectRequest) => http.put<ProjectDto>(`/api/masterdata/projects/${id}`, body),

  createModule: (body: CreateModuleRequest) => http.post<ModuleDto>('/api/masterdata/modules', body),
  updateModule: (id: number, body: UpdateModuleRequest) => http.put<ModuleDto>(`/api/masterdata/modules/${id}`, body),

  createTask: (body: CreateTaskRequest) => http.post<WorkTaskDto>('/api/masterdata/tasks', body),
  updateTask: (id: number, body: UpdateTaskRequest) => http.put<WorkTaskDto>(`/api/masterdata/tasks/${id}`, body),

  createHoliday: (body: CreateHolidayRequest) => http.post<HolidayDto>('/api/masterdata/holidays', body),
  updateHoliday: (id: number, body: UpdateHolidayRequest) => http.put<HolidayDto>(`/api/masterdata/holidays/${id}`, body),
  deleteHoliday: (id: number) => http.delete<void>(`/api/masterdata/holidays/${id}`),
};