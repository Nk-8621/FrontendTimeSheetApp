import { http } from './httpClient';
import type { LoginResult } from './authTypes';
 
export const authApi = {
  login: (identifier: string, password: string) =>
    http.post<LoginResult>('/api/auth/login', { identifier, password }),
 
  verifyFirstLoginOtp: (employeeCode: string, otpCode: string, newPassword: string, confirmNewPassword: string) =>
    http.post<LoginResult>('/api/auth/first-login/verify-otp', { employeeCode, otpCode, newPassword, confirmNewPassword }),
 
  resendFirstLoginOtp: (employeeCode: string) =>
    http.post<void>('/api/auth/first-login/resend-otp', { employeeCode }),
 
  // Forgot password — request-otp and resend-otp always return a generic
  // success message regardless of whether the identifier matched a real
  // account (deliberate, matches the backend's anti-enumeration behavior).
  requestPasswordReset: (identifier: string) =>
    http.post<{ title: string }>('/api/auth/forgot-password/request-otp', { identifier }),
 
  resendPasswordResetOtp: (identifier: string) =>
    http.post<{ title: string }>('/api/auth/forgot-password/resend-otp', { identifier }),
 
  resetPassword: (identifier: string, otpCode: string, newPassword: string, confirmNewPassword: string) =>
    http.post<LoginResult>('/api/auth/forgot-password/reset', { identifier, otpCode, newPassword, confirmNewPassword }),
};