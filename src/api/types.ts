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
  projectTypeId: number | null;
  projectTypeName: string | null;
  projectTech: string | null;
  billingType: string | null;
  customerPO: string | null;
  notes: string | null;
  needsReview: boolean;
  projectLeadEmployeeId: number | null;
  projectLeadEmployeeName: string | null;
  projectManagerEmployeeId: number | null;
  projectManagerEmployeeName: string | null;
  deliveryHeadEmployeeId: number | null;
  deliveryHeadEmployeeName: string | null;
}

/** A Project Type (Level-0) — replaces the old flat TaskCategory. Its
 * Level-1/Level-2 template tree is fetched separately via
 * ProjectTypeWithTemplateDto, since most screens only need id/code/name. */
export interface ProjectTypeDto {
  id: number;
  code: string;
  name: string;
}

export interface ProjectTypeModuleTemplateDto {
  id: number;
  projectTypeId: number;
  name: string;
  sortOrder: number;
}

export interface ProjectTypeTaskTemplateDto {
  id: number;
  projectTypeModuleTemplateId: number;
  name: string;
  sortOrder: number;
}

/** One Level-1 template row together with its Level-2 (task) children —
 * backs the Project Type template-management screen's tree view. */
export interface ModuleWithTaskTemplatesDto {
  id: number;
  name: string;
  sortOrder: number;
  tasks: ProjectTypeTaskTemplateDto[];
}

/** A Project Type together with its full Level-1/Level-2 template tree. */
export interface ProjectTypeWithTemplateDto {
  id: number;
  code: string;
  name: string;
  modules: ModuleWithTaskTemplatesDto[];
}

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
  /** If supplied, auto-creates the project's starter Modules/Tasks from that
   * Project Type's Level-1/Level-2 template. Pass null to create an empty
   * project with no modules yet. */
  projectTypeId?: number | null;
  projectTech?: string | null;
  billingType?: string | null;
  customerPO?: string | null;
  notes?: string | null;
  projectLeadEmployeeId?: number | null;
  projectManagerEmployeeId?: number | null;
  deliveryHeadEmployeeId?: number | null;
}
/** projectTypeId is retroactive-classification-only — the backend applies
 * it ONLY when the project currently has no projectTypeId (one created
 * before this feature, or without one). It does not auto-create that
 * type's starter Modules/Tasks, and once a project has a projectTypeId
 * this can no longer change it (its Module/Task template has already been
 * applied and shouldn't silently change). */
export interface UpdateProjectRequest {
  accountId?: number;
  code?: string;
  name?: string;
  defaultBillable?: boolean;
  isActive?: boolean;
  projectTypeId?: number | null;
  projectTech?: string | null;
  billingType?: string | null;
  customerPO?: string | null;
  notes?: string | null;
  needsReview?: boolean;
  projectLeadEmployeeId?: number | null;
  projectManagerEmployeeId?: number | null;
  deliveryHeadEmployeeId?: number | null;
}

export interface CreateModuleRequest {
  projectId: number;
  name: string;
  projectTypeId?: number | null;
}
export interface UpdateModuleRequest {
  name?: string;
  projectTypeId?: number | null;
}

export interface CreateTaskRequest {
  moduleId: number;
  name: string;
}
export interface UpdateTaskRequest {
  name?: string;
}

export interface CreateProjectTypeRequest {
  code: string;
  name: string;
}
export interface UpdateProjectTypeRequest {
  code?: string;
  name?: string;
}
/** replacementProjectTypeId lets an admin reassign every Project/Module
 * currently on this Project Type to another one before it's deleted — omit
 * to just attempt the delete (fails with a clear error if still referenced). */
export interface DeleteProjectTypeRequest {
  replacementProjectTypeId?: number | null;
}

export interface CreateProjectTypeModuleTemplateRequest {
  projectTypeId: number;
  name: string;
  sortOrder: number;
}
export interface UpdateProjectTypeModuleTemplateRequest {
  name?: string;
}
export interface CreateProjectTypeTaskTemplateRequest {
  projectTypeModuleTemplateId: number;
  name: string;
  sortOrder: number;
}
export interface UpdateProjectTypeTaskTemplateRequest {
  name?: string;
}

/** Self-service "Others" quick-add (backend endpoints only — no frontend
 * consumer on this branch yet; kept for parity/future use). */
export interface QuickAddProjectRequest {
  name: string;
}
export interface QuickAddModuleRequest {
  projectId: number;
  name: string;
}
export interface QuickAddTaskRequest {
  moduleId: number;
  name: string;
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
  projectTypeId: number | null;
  projectTypeCode: string | null;
}

export interface WorkTaskDto {
  id: number;
  moduleId: number;
  name: string;
}

// ---- Project-wise resource allocation (admin reporting) ----

export interface ProjectResourceAllocationDto {
  projectId: number;
  projectCode: string;
  projectName: string;
  resourceCount: number;
}
export interface AllocatedEmployeeDto {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  departmentName: string;
}
export interface SetEmployeeProjectAllocationsRequest {
  projectIds: number[];
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
  primaryAccountId: number | null;
}

/** Monday..Sunday, matching the backend's HoursByDay array order. */
export type WeekHours = [number, number, number, number, number, number, number];

export type TimeEntryClassification = 'Billable' | 'NonBillable' | 'PartialBillable';
export type TimeEntryBillingCategory = 'AMS' | 'T&M' | 'FB' | 'OH';

export interface TimeEntryDto {
  id: number;
  employeeCode: string;
  weekStartDate: string; // ISO date, e.g. "2026-07-27"
  projectId: number;
  moduleId: number;
  taskId: number;
  classification: TimeEntryClassification;
  billingCategory: TimeEntryBillingCategory | null;
  note: string | null;
  hoursByDay: WeekHours;
}

export interface CreateTimeEntryRequest {
  projectId: number;
  moduleId: number;
  taskId: number;
  classification: TimeEntryClassification;
  billingCategory: string | null;
  note: string | null;
  hoursByDay: WeekHours;
}

export interface UpdateTimeEntryRequest {
  projectId?: number;
  moduleId?: number;
  taskId?: number;
  classification?: TimeEntryClassification | null;
  billingCategory?: string | null;
  note?: string | null;
  hoursByDay?: WeekHours;
}

export type ApiDayType = 'W' | 'WFH' | 'L' | 'LH' | 'H' | 'O';

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

export type DayTypeRequestType = 'WFH' | 'LeaveFirstHalf' | 'LeaveSecondHalf' | 'LeaveFull';
export type DayTypeRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface DayTypeRequestDto {
  id: number;
  employeeCode: string;
  employeeName: string;
  requestDate: string;
  requestType: DayTypeRequestType;
  status: DayTypeRequestStatus;
  note: string | null;
  submittedAt: string;
  approverName: string | null;
  decidedAt: string | null;
  decisionComment: string | null;
}

export interface CreateDayTypeRequestRequest {
  date: string;
  requestType: DayTypeRequestType;
  note: string | null;
}

export interface DecideDayTypeRequestRequest {
  comment: string | null;
}

export interface WeekSummaryDto {
  week: WeekRecordDto;
  entries: TimeEntryDto[];
  dayTypes: DayTypeDto[];
  totalHours: number;
  billableHours: number;
  partialBillableHours: number;
  capacityHours: number;
  dayTypeRequests: DayTypeRequestDto[];
}

export interface WeekHistoryItemDto {
  weekStartDate: string;
  status: WeekStatusDto;
  totalHours: number;
  billableHours: number;
  partialBillableHours: number;
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
  dailyLeaveHalf: (DayTypeRequestType | null)[]; // "LeaveFirstHalf"/"LeaveSecondHalf" where dailyDayTypes is 'LH', else null
  capacityHours: number;
  billableHours: number;
  partialBillableHours: number;
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
  classification: TimeEntryClassification;
  billingCategory: TimeEntryBillingCategory | null;
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
  partialBillableHours: number;
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
  partialBillableHours: number;
  nonBillableHours: number;
  resourceCount: number;
}

export type ReportApprovalStatus = 'all' | 'sub' | 'ok';

export interface ReportsSummaryDto {
  actualHours: number;
  billableHours: number;
  totalPartialBillableHours: number;
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
  partialBillableHours: number;
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
