import { http } from './httpClient';
import type { AccessProfileDto, EmployeeDto, SetEmployeeProjectAllocationsRequest } from './types';

export const employeesApi = {
  getAll: () => http.get<EmployeeDto[]>('/api/employees'),
  getMe: () => http.get<EmployeeDto>('/api/employees/me'),
  getByCode: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}`),
  getManager: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}/manager`),
  getDirectReports: (code: string) => http.get<EmployeeDto[]>(`/api/employees/${code}/direct-reports`),
  getAccess: (code: string) => http.get<AccessProfileDto>(`/api/employees/${code}/access`),
  setPrimaryAccount: (employeeCode: string, accountId: number | null) =>
  http.put<void>(`/api/employees/${employeeCode}/primary-account`, { accountId }),
  // employees.ts
  create: (request: {
  fullName: string;
  email: string;
  designation: string;
  managerEmployeeCode: string;
  departmentId: number;
  isExternal: boolean;
  employeeCode: string | null;
  /** Projects to allocate this employee to right away — the same checkbox
   * list shown on the Add Employee form. Omit/empty to skip (allocations
   * can always be added later from the Resources tab). */
  projectIds?: number[] | null;
}) => http.post<EmployeeDto>('/api/employees', request),

deactivate: (employeeCode: string) => http.post<void>(`/api/employees/${employeeCode}/deactivate`),
reactivate: (employeeCode: string) => http.post<void>(`/api/employees/${employeeCode}/reactivate`),

// ---- Project allocations (backs the Resources tab's allocation editor) ----
// Backend returns just the allocated Project IDs (IReadOnlyList<int>), not full ProjectDtos.
getProjectAllocations: (employeeCode: string) => http.get<number[]>(`/api/employees/${employeeCode}/projects`),
setProjectAllocations: (employeeCode: string, body: SetEmployeeProjectAllocationsRequest) =>
  http.put<void>(`/api/employees/${employeeCode}/projects`, body),
};
