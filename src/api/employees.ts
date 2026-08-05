import { http } from './httpClient';
import type { AccessProfileDto, EmployeeDto } from './types';

export const employeesApi = {
  getAll: () => http.get<EmployeeDto[]>('/api/employees'),
  getMe: () => http.get<EmployeeDto>('/api/employees/me'),
  getByCode: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}`),
  getManager: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}/manager`),
  getDirectReports: (code: string) => http.get<EmployeeDto[]>(`/api/employees/${code}/direct-reports`),
  getAccess: (code: string) => http.get<AccessProfileDto>(`/api/employees/${code}/access`),
};