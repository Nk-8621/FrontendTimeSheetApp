// Mirrors Meridian.Application.DTOs exactly — field names match the JSON
// the .NET API actually returns (camelCase), not the frontend's older
// wireframe-derived short-key types in types/meridian.ts. Keeping these
// separate makes it obvious which types describe "what the server sends"
// vs. "how the UI labels things" (NAV_GROUPS, DAY_TYPE_LABELS, etc. stay
// frontend-only concerns).

export interface DepartmentDto {
  id: number;
  code: string;
  name: string;
  parentDepartmentId: number | null;
}

export interface LocationDto {
  id: number;
  code: string;
  name: string;
}

export interface AccountDto {
  id: number;
  departmentId: number;
  name: string;
  accountType: 'Customer' | 'Internal';
}

export interface ProjectDto {
  id: number;
  accountId: number;
  code: string;
  name: string;
  defaultBillable: boolean;
  isActive: boolean;
}

export interface TaskCategoryDto {
  id: number;
  code: string;
  name: string;
}

// export interface HolidayDto {
//   id: number;
//   date: string;
//   name: string;
//   location: string;
// }

// ---- Admin-only create/update requests (Master Data screen) ----

export interface CreateAccountRequest {
  departmentId: number;
  name: string;
  accountType: 'Customer' | 'Internal';
}
export interface UpdateAccountRequest {
  departmentId?: number;
  name?: string;
  accountType?: 'Customer' | 'Internal';
}

export interface CreateProjectRequest {
  accountId: number;
  code: string;
  name: string;
  defaultBillable: boolean;
  /** If supplied, auto-creates a starter "General" module pre-populated with
   * that category's task list (matching the original wireframe). Pass
   * undefined/null to create an empty project with no modules yet. */
  initialModuleTaskCategoryCode?: string | null;
}
export interface UpdateProjectRequest {
  accountId?: number;
  code?: string;
  name?: string;
  defaultBillable?: boolean;
  isActive?: boolean;
}

export interface CreateModuleRequest {
  projectId: number;
  name: string;
  taskCategoryCode: string;
}
export interface UpdateModuleRequest {
  name?: string;
  taskCategoryCode?: string;
}

export interface CreateTaskRequest {
  moduleId: number;
  name: string;
}
export interface UpdateTaskRequest {
  name?: string;
}

export interface CreateHolidayRequest {
  holidayDate: string;
  name: string;
  location: string;
}
export interface UpdateHolidayRequest {
  id : number;
  holidayDate: string;
  name?: string;
  location?: string;
}

export interface ModuleDto {
  id: number;
  projectId: number;
  name: string;
  taskCategoryCode: string;
}

export interface WorkTaskDto {
  id: number;
  moduleId: number;
  name: string;
}

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  fullName: string;
  initials: string;
  departmentId: number;
  locationId: number;
  designation: string;
  grade: string | null;
  managerEmployeeId: number | null;
  managerName: string | null;
  isActive: boolean;
}

/** Monday..Sunday, matching the backend's HoursByDay array order. */
export type WeekHours = [number, number, number, number, number, number, number];

export interface TimeEntryDto {
  id: number;
  employeeCode: string;
  weekStartDate: string; // ISO date, e.g. "2026-07-27"
  projectId: number;
  moduleId: number;
  taskId: number;
  isBillable: boolean;
  note: string | null;
  hoursByDay: WeekHours;
}

export interface CreateTimeEntryRequest {
  projectId: number;
  moduleId: number;
  taskId: number;
  isBillable: boolean;
  note: string | null;
  hoursByDay: WeekHours;
}

export interface UpdateTimeEntryRequest {
  projectId?: number;
  moduleId?: number;
  taskId?: number;
  isBillable?: boolean;
  note?: string | null;
  hoursByDay?: WeekHours;
}

export type ApiDayType = 'W' | 'WFH' | 'L' | 'H' | 'O';

export interface DayTypeDto {
  date: string;
  dayType: ApiDayType;
  capacityHours: number;
}

export type WeekStatusDto = 'Draft' | 'PendingL1' | 'PendingL2' | 'Approved' | 'Rejected';

export interface ApprovalEventDto {
  text: string;
  meta: string | null;
  status: 'Ok' | 'Pending' | 'Rejected' | null;
  timestamp: string;
}

export interface WeekRecordDto {
  employeeCode: string;
  weekStartDate: string;
  status: WeekStatusDto;
  submittedAt: string | null;
  rejectedByName: string | null;
  rejectionReason: string | null;
  trail: ApprovalEventDto[];
}

export interface WeekSummaryDto {
  week: WeekRecordDto;
  entries: TimeEntryDto[];
  dayTypes: DayTypeDto[];
  totalHours: number;
  billableHours: number;
  capacityHours: number;
}

export interface WeekHistoryItemDto {
  weekStartDate: string;
  status: WeekStatusDto;
  totalHours: number;
  billableHours: number;
  submittedAt: string | null;
}

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  kind: 'Warning' | 'Info' | 'Risk';
  createdAt: string;
  readAt: string | null;
  isBroadcast: boolean;
}

export interface TeamComplianceRowDto {
  employeeCode: string;
  fullName: string;
  designation: string;
  departmentName: string;
  status: string; // NotStarted, Draft, PendingL1, PendingL2, Approved, Rejected
  totalHours: number;
  hasLogged: boolean;
  dailyHours: WeekHours;
  dailyDayTypes: ApiDayType[];
  capacityHours: number;
  billableHours: number;
  nonBillableHours: number;
}

/** One logged line, with every level of the hierarchy resolved to a display
 * name — backs the Approval Queue's expandable row detail. */
export interface ApprovalQueueLineDto {
  departmentCode: string;
  accountName: string;
  accountType: string;
  projectName: string;
  projectCode: string;
  moduleName: string;
  taskName: string;
  isBillable: boolean;
  hoursByDay: WeekHours;
  note: string | null;
}

/** One week in an approver's queue — flags, billable split, and full line
 * detail all in one object (no separate per-row fetches needed). */
export interface ApprovalQueueItemDto {
  employeeCode: string;
  fullName: string;
  designation: string;
  departmentName: string;
  weekStartDate: string;
  submittedAt: string | null;
  status: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  projectCount: number;
  lineCount: number;
  flags: string[];
  lines: ApprovalQueueLineDto[];
  dayTypes: DayTypeDto[];
}

/** One row in any of the Reports screen's five rollup tabs. */
export interface ReportRollupRowDto {
  key: string;
  subLabel: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  resourceCount: number;
}

export type ReportApprovalStatus = 'all' | 'sub' | 'ok';

export interface ReportsSummaryDto {
  actualHours: number;
  billableHours: number;
  nonBillableHours: number;
  resourcesReporting: number;
  projectsInScope: number;
  taskLineCount: number;
  departmentWise: ReportRollupRowDto[];
  accountWise: ReportRollupRowDto[];
  projectWise: ReportRollupRowDto[];
  resourceWise: ReportRollupRowDto[];
  taskWise: ReportRollupRowDto[];
}

export interface ProjectHoursReportRowDto {
  projectId: number;
  projectCode: string;
  projectName: string;
  accountName: string;
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  employeeCount: number;
}

export interface WeekValidationResult {
  errors: string[];
  warnings: string[];
  canSubmit: boolean;
}

/** What this employee is allowed to see (RBAC), computed server-side from
 * their real position in the org hierarchy — not a fixed role. */
export interface AccessProfileDto {
  employeeCode: string;
  isAdmin: boolean;
  requiresTimesheet: boolean;
  isLevel1ApproverForSomeone: boolean;
  isLevel2ApproverForSomeone: boolean;
  navKeys: string[];
}

export interface HolidayDto {
  holidayId: number;
  date: string;
  name: string;
  location: string;
  accountId: number | null;
}