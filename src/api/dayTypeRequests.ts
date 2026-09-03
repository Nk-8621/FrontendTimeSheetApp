import { http } from './httpClient';
import type { CreateDayTypeRequestRequest, DayTypeRequestDto, DecideDayTypeRequestRequest } from './types';

export const dayTypeRequestsApi = {
  getMine: (employeeCode: string) =>
    http.get<DayTypeRequestDto[]>(`/api/day-type-requests/${employeeCode}`),

  submit: (employeeCode: string, body: CreateDayTypeRequestRequest) =>
    http.post<DayTypeRequestDto>(`/api/day-type-requests/${employeeCode}`, body),

  getQueue: () => http.get<DayTypeRequestDto[]>('/api/day-type-requests/queue'),

  approve: (requestId: number) =>
    http.post<DayTypeRequestDto>(`/api/day-type-requests/${requestId}/approve`),

  reject: (requestId: number, comment: string | null) =>
    http.post<DayTypeRequestDto>(`/api/day-type-requests/${requestId}/reject`, { comment } satisfies DecideDayTypeRequestRequest),
};
