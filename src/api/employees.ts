import { http } from './httpClient';
import type { EmployeeDto } from './types';

export const employeesApi = {
  getMe: () => http.get<EmployeeDto>('/api/employees/me'),
  getByCode: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}`),
  getManager: (code: string) => http.get<EmployeeDto>(`/api/employees/${code}/manager`),
  getDirectReports: (code: string) => http.get<EmployeeDto[]>(`/api/employees/${code}/direct-reports`),
};
