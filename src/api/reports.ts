import { http } from './httpClient';
import type { ProjectHoursReportRowDto, ReportApprovalStatus, ReportsSummaryDto } from './types';

export const reportsApi = {
  getProjectHours: (weekStart: string) =>
    http.get<ProjectHoursReportRowDto[]>(`/api/reports/project-hours?weekStart=${weekStart}`),

  getSummary: (weekFrom: string, weekTo: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) => {
    const params = new URLSearchParams({ weekFrom, weekTo, approvalStatus });
    if (departmentId) params.set('departmentId', String(departmentId));
    return http.get<ReportsSummaryDto>(`/api/reports/summary?${params.toString()}`);
  },
};