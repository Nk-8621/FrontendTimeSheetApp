import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';

export function useProjectHoursReport(weekStart: string) {
  return useQuery({
    queryKey: ['project-hours-report', weekStart],
    queryFn: () => reportsApi.getProjectHours(weekStart),
  });
}