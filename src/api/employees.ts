import { http } from './httpClient';
import type { AccessProfileDto, EmployeeDto } from './types';

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
}) => http.post<EmployeeDto>('/api/employees', request),

deactivate: (employeeCode: string) => http.post<void>(`/api/employees/${employeeCode}/deactivate`),
reactivate: (employeeCode: string) => http.post<void>(`/api/employees/${employeeCode}/reactivate`),
};

