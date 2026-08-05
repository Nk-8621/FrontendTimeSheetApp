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
export function useReportsSummary(weekFrom: string, weekTo: string, departmentId: number | undefined, approvalStatus: ReportApprovalStatus) {
  return useQuery({
    queryKey: ['reports-summary', weekFrom, weekTo, departmentId, approvalStatus],
    queryFn: () => reportsApi.getSummary(weekFrom, weekTo, departmentId, approvalStatus),
  });
}