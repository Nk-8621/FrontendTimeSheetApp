import { http } from './httpClient';
import type { ProjectHoursReportRowDto, ReportApprovalStatus, ReportsSummaryDto } from './types';
import { mondayOf } from '../lib/dates';

export const reportsApi = {
  getProjectHours: (weekStart: string) =>
    http.get<ProjectHoursReportRowDto[]>(`/api/reports/project-hours?weekStart=${weekStart}`),

  // DATE RANGE (Nov 2026): takes exact From/To dates. The backend still gets
  // weekFrom/weekTo (the Mondays of those dates) plus from/to, and counts only
  // the days between from and to. To revert: go back to (weekFrom, weekTo) only.
  getSummary: (fromDate: string, toDate: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) => {
    const params = new URLSearchParams({
      weekFrom: mondayOf(fromDate),
      weekTo: mondayOf(toDate),
      from: fromDate,
      to: toDate,
      approvalStatus,
    });
    if (departmentId) params.set('departmentId', String(departmentId));
    return http.get<ReportsSummaryDto>(`/api/reports/summary?${params.toString()}`);
  },
};