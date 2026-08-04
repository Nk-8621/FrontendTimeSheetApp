import { http } from './httpClient';
import type { CreateTimeEntryRequest, DayTypeDto, TimeEntryDto, UpdateTimeEntryRequest, WeekHistoryItemDto, WeekSummaryDto } from './types';

export const timesheetApi = {
  getWeek: (employeeCode: string, weekStart: string) =>
    http.get<WeekSummaryDto>(`/api/timesheet/${employeeCode}/${weekStart}`),

  getHistory: (employeeCode: string) =>
    http.get<WeekHistoryItemDto[]>(`/api/timesheet/${employeeCode}/history`),

  addEntry: (employeeCode: string, weekStart: string, body: CreateTimeEntryRequest) =>
    http.post<TimeEntryDto>(`/api/timesheet/${employeeCode}/${weekStart}/entries`, body),

  updateEntry: (timeEntryId: number, body: UpdateTimeEntryRequest) =>
    http.put<TimeEntryDto>(`/api/timesheet/entries/${timeEntryId}`, body),

  removeEntry: (timeEntryId: number) => http.delete<void>(`/api/timesheet/entries/${timeEntryId}`),

  setDayType: (employeeCode: string, date: string, dayType: string) =>
    http.put<DayTypeDto>(`/api/timesheet/${employeeCode}/day-type/${date}`, { dayType }),

  copyLastWeek: (employeeCode: string, weekStart: string) =>
    http.post<{ linesAdded: number }>(`/api/timesheet/${employeeCode}/${weekStart}/copy-last-week`),
};