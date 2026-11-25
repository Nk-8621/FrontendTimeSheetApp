import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import type { ReportApprovalStatus } from '../../api/types';

export function useProjectHoursReport(weekStart: string) {
  return useQuery({
    queryKey: ['project-hours-report', weekStart],
    queryFn: () => reportsApi.getProjectHours(weekStart),
  });
}

/** The full Reports screen: all 5 rollup views computed once from the
 * filtered dataset (week range, department, approval status). */
// DATE RANGE (Nov 2026): fromDate/toDate are exact dates (were week starts).
export function useReportsSummary(fromDate: string, toDate: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) {
  return useQuery({
    queryKey: ['reports-summary', fromDate, toDate, departmentId, approvalStatus],
    queryFn: () => reportsApi.getSummary(fromDate, toDate, departmentId, approvalStatus),
    // Don't call the backend while To is before From.
    enabled: Boolean(fromDate && toDate && toDate >= fromDate),
  });
}