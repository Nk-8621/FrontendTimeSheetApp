import { http } from './httpClient';
import type { AccountDto, DepartmentDto, LocationDto, ModuleDto, ProjectDto, WorkTaskDto } from './types';

export const masterDataApi = {
  getDepartments: () => http.get<DepartmentDto[]>('/api/masterdata/departments'),
  getLocations: () => http.get<LocationDto[]>('/api/masterdata/locations'),
  getAccounts: () => http.get<AccountDto[]>('/api/masterdata/accounts'),
  getProjects: () => http.get<ProjectDto[]>('/api/masterdata/projects'),
  getModules: (projectId?: number) =>
    http.get<ModuleDto[]>(`/api/masterdata/modules${projectId ? `?projectId=${projectId}` : ''}`),
  getTasks: (moduleId?: number) =>
    http.get<WorkTaskDto[]>(`/api/masterdata/tasks${moduleId ? `?moduleId=${moduleId}` : ''}`),
};
