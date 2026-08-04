import { http } from './httpClient';
import type { TeamComplianceRowDto } from './types';

export const teamApi = {
  getCompliance: (weekStart: string) =>
    http.get<TeamComplianceRowDto[]>(`/api/team/compliance?weekStart=${weekStart}`),
  getComplianceAll: (weekStart: string) =>
    http.get<TeamComplianceRowDto[]>(`/api/team/compliance/all?weekStart=${weekStart}`),
};