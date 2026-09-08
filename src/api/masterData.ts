import { http } from './httpClient';
import type {
  AccountDto, CreateAccountRequest, UpdateAccountRequest,
  CreateHolidayRequest, UpdateHolidayRequest, HolidayDto,
  CreateModuleRequest, UpdateModuleRequest,
  CreateProjectRequest, UpdateProjectRequest,
  CreateTaskRequest, UpdateTaskRequest,
  DepartmentDto, LocationDto, ModuleDto, ProjectDto, WorkTaskDto,
  ProjectTypeDto, ProjectTypeWithTemplateDto,
  CreateProjectTypeRequest, UpdateProjectTypeRequest, DeleteProjectTypeRequest,
  ProjectTypeModuleTemplateDto, CreateProjectTypeModuleTemplateRequest, UpdateProjectTypeModuleTemplateRequest,
  ProjectTypeTaskTemplateDto, CreateProjectTypeTaskTemplateRequest, UpdateProjectTypeTaskTemplateRequest,
  QuickAddProjectRequest, QuickAddModuleRequest, QuickAddTaskRequest,
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
  getProjectTypes: () => http.get<ProjectTypeDto[]>('/api/masterdata/project-types'),
  /** Admin-only - full Level-1/Level-2 tree for the template management screen. */
  getProjectTypesWithTemplates: () => http.get<ProjectTypeWithTemplateDto[]>('/api/masterdata/project-types/with-templates'),

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

  // ---- Project Type template management (Admin only) ----
  createProjectType: (body: CreateProjectTypeRequest) => http.post<ProjectTypeDto>('/api/masterdata/project-types', body),
  updateProjectType: (id: number, body: UpdateProjectTypeRequest) => http.put<ProjectTypeDto>(`/api/masterdata/project-types/${id}`, body),
  /** Fails with a clear error if any Project still uses this type and no
   * replacementProjectTypeId was supplied — see DeleteProjectTypeRequest. */
  deleteProjectType: (id: number, body: DeleteProjectTypeRequest) => http.delete<void>(`/api/masterdata/project-types/${id}`, body),

  createModuleTemplate: (body: CreateProjectTypeModuleTemplateRequest) =>
    http.post<ProjectTypeModuleTemplateDto>('/api/masterdata/project-types/module-templates', body),
  updateModuleTemplate: (id: number, body: UpdateProjectTypeModuleTemplateRequest) =>
    http.put<ProjectTypeModuleTemplateDto>(`/api/masterdata/project-types/module-templates/${id}`, body),
  deleteModuleTemplate: (id: number) => http.delete<void>(`/api/masterdata/project-types/module-templates/${id}`),

  createTaskTemplate: (body: CreateProjectTypeTaskTemplateRequest) =>
    http.post<ProjectTypeTaskTemplateDto>('/api/masterdata/project-types/task-templates', body),
  updateTaskTemplate: (id: number, body: UpdateProjectTypeTaskTemplateRequest) =>
    http.put<ProjectTypeTaskTemplateDto>(`/api/masterdata/project-types/task-templates/${id}`, body),
  deleteTaskTemplate: (id: number) => http.delete<void>(`/api/masterdata/project-types/task-templates/${id}`),

  // ---- "Others" quick-add (Add Task Line — any authenticated employee) ----
  quickAddProject: (body: QuickAddProjectRequest) => http.post<ProjectDto>('/api/masterdata/quick-add/project', body),
  quickAddModule: (body: QuickAddModuleRequest) => http.post<ModuleDto>('/api/masterdata/quick-add/module', body),
  quickAddTask: (body: QuickAddTaskRequest) => http.post<WorkTaskDto>('/api/masterdata/quick-add/task', body),
};
