import { http } from './httpClient';
import type { EmployeeDto } from './types';

export const authApi = {
  login: (employeeCode: string, password: string) =>
    http.post<EmployeeDto>('/api/auth/login', { employeeCode, password }),
};