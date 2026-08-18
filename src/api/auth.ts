import { http } from './httpClient';
import type { LoginResult } from './authTypes';

export const authApi = {
  login: (employeeCode: string, password: string) =>
    http.post<LoginResult>('/api/auth/login', { employeeCode, password }),

  verifyFirstLoginOtp: (employeeCode: string, otpCode: string, newPassword: string, confirmNewPassword: string) =>
    http.post<LoginResult>('/api/auth/first-login/verify-otp', { employeeCode, otpCode, newPassword, confirmNewPassword }),

  resendFirstLoginOtp: (employeeCode: string) =>
    http.post<void>('/api/auth/first-login/resend-otp', { employeeCode }),
};