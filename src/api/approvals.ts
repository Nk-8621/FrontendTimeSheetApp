import { http } from './httpClient';
import type { ApprovalQueueItemDto, WeekRecordDto, WeekValidationResult } from './types';

export const approvalsApi = {
  validate: (employeeCode: string, weekStart: string) =>
    http.get<WeekValidationResult>(`/api/approvals/validate/${employeeCode}/${weekStart}`),

  submit: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/submit`),

  recall: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/recall`),

  approveLevel1: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/approve-level1`),

  approveLevel2: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/approve-level2`),

  reject: (employeeCode: string, weekStart: string, reason: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/reject`, { reason }),

  getPending: (level2: boolean) =>
    http.get<WeekRecordDto[]>(`/api/approvals/pending?level2=${level2}`),

  getQueue: (level2: boolean) =>
    http.get<ApprovalQueueItemDto[]>(`/api/approvals/queue?level2=${level2}`),
};