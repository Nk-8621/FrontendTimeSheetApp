import { http } from './httpClient';
import type { ProjectHoursReportRowDto } from './types';

export const reportsApi = {
  getProjectHours: (weekStart: string) =>
    http.get<ProjectHoursReportRowDto[]>(`/api/reports/project-hours?weekStart=${weekStart}`),
};