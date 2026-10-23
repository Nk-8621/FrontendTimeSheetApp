import { http } from './httpClient';
import type { ApprovalQueueItemDto, WeekRecordDto, WeekValidationResult } from './types';

export const approvalsApi = {
  validate: (employeeCode: string, weekStart: string) =>
    http.get<WeekValidationResult>(`/api/approvals/validate/${employeeCode}/${weekStart}`),

  submit: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/submit`),

  recall: (employeeCode: string, weekStart: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/recall`),

  // comment is optional (bulk approve sends none) - shown on the week's
  // approval trail next to the "Level N approved" event.
  approveLevel1: (employeeCode: string, weekStart: string, comment?: string | null) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/approve-level1`, comment ? { comment } : undefined),

  approveLevel2: (employeeCode: string, weekStart: string, comment?: string | null) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/approve-level2`, comment ? { comment } : undefined),

  reject: (employeeCode: string, weekStart: string, reason: string) =>
    http.post<WeekRecordDto>(`/api/approvals/${employeeCode}/${weekStart}/reject`, { reason }),

  getPending: (level2: boolean) =>
    http.get<WeekRecordDto[]>(`/api/approvals/pending?level2=${level2}`),

  getQueue: (level2: boolean) =>
    http.get<ApprovalQueueItemDto[]>(`/api/approvals/queue?level2=${level2}`),

  getWeekDetail: (employeeCode: string, weekStart: string) =>
  http.get<ApprovalQueueItemDto>(`/api/approvals/${employeeCode}/${weekStart}/detail`),
};
