import { http } from './httpClient';

export const changePasswordApi = {
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) =>
    http.post<void>('/api/auth/change-password', { currentPassword, newPassword, confirmNewPassword }),
};