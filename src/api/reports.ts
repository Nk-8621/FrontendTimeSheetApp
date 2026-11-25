import { http, ApiError } from './httpClient';
import { getAuthHeaders } from './authBridge';
import type { ProjectHoursReportRowDto, ReportApprovalStatus, ReportsSummaryDto } from './types';
import { mondayOf } from '../lib/dates';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Same query string for the screen (summary) and the Excel download (export). */
function summaryParams(fromDate: string, toDate: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) {
  const params = new URLSearchParams({
    weekFrom: mondayOf(fromDate),
    weekTo: mondayOf(toDate),
    from: fromDate,
    to: toDate,
    approvalStatus,
  });
  if (departmentId) params.set('departmentId', String(departmentId));
  return params.toString();
}

export const reportsApi = {
  getProjectHours: (weekStart: string) =>
    http.get<ProjectHoursReportRowDto[]>(`/api/reports/project-hours?weekStart=${weekStart}`),

  // DATE RANGE (Nov 2026): takes exact From/To dates. The backend still gets
  // weekFrom/weekTo (the Mondays of those dates) plus from/to, and counts only
  // the days between from and to. To revert: go back to (weekFrom, weekTo) only.
  getSummary: (fromDate: string, toDate: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) =>
    http.get<ReportsSummaryDto>(`/api/reports/summary?${summaryParams(fromDate, toDate, departmentId, approvalStatus)}`),

  /** REPORTS DOWNLOAD (Nov 2026): the same report as an Excel file (Blob).
   * Uses fetch directly because the shared `http` helper only reads JSON. */
  async downloadSummaryExcel(fromDate: string, toDate: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus): Promise<Blob> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/reports/summary/export?${summaryParams(fromDate, toDate, departmentId, approvalStatus)}`,
      { method: 'GET', headers: { ...authHeaders } },
    );
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, errorBody?.title ?? 'Could not download the report.');
    }
    return response.blob();
  },
};