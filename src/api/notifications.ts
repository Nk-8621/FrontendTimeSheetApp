import { http } from './httpClient';
import type { NotificationDto } from './types';

export const notificationsApi = {
  getMine: () => http.get<NotificationDto[]>('/api/notifications'),
  markAsRead: (id: number) => http.put<void>(`/api/notifications/${id}/read`),
};
