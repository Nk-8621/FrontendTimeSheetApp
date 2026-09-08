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
  /** Free-text technology tag (e.g. "Digital IOT", "Analytics") - no fixed list. */
  projectTech: string | null;
  billingType: string | null;
  customerPO: string | null;
  notes: string | null;
  /** True for a project auto-created via the "Others" quick-add flow -
   * missing a real Account/Code/BillingType until admin fills them in. */
  needsReview: boolean;
  projectLeadEmployeeId: number | null;
  projectLeadEmployeeName: string | null;
  projectManagerEmployeeId: number | null;
  projectManagerEmployeeName: string | null;
  deliveryHeadEmployeeId: number | null;
  deliveryHeadEmployeeName: string | null;
}

// ---- Project Type + its Level-1/Level-2 template ----

export interface ProjectTypeDto {
  id: number;
  code: string;
  name: string;
}

export interface ProjectTypeTaskTemplateDto {
  id: number;
  name: string;
  sortOrder: number;
}

export interface ProjectTypeModuleTemplateDto {
  id: number;
  name: string;
  sortOrder: number;
  tasks: ProjectTypeTaskTemplateDto[];
}

/** Full tree for the admin Project Type template-management screen. */
export interface ProjectTypeWithTemplateDto {
  id: number;
  code: string;
  name: string;
  modules: ProjectTypeModuleTemplateDto[];
}

export interface CreateProjectTypeRequest {
  code: string;
  name: string;
}
export interface UpdateProjectTypeRequest {
  code?: string;
  name?: string;
}
/** Deleting a Project Type that any Project still uses requires picking a
 * replacement up front - every affected Project gets reassigned to
 * replacementProjectTypeId before the delete proceeds. */
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
  sortOrder?: number;
}
export interface CreateProjectTypeTaskTemplateRequest {
  projectTypeModuleTemplateId: number;
  name: string;
  sortOrder: number;
}
export interface UpdateProjectTypeTaskTemplateRequest {
  name?: string;
  sortOrder?: number;
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
  /** If supplied, auto-generates the full real Module(L1)/Task(L2) tree from
   * that type's template under the new project. Pass null to create an
   * empty project with no modules yet. */
  projectTypeId: number | null;
  projectTech?: string | null;
  billingType?: string | null;
  customerPO?: string | null;
  notes?: string | null;
  projectLeadEmployeeId?: number | null;
  projectManagerEmployeeId?: number | null;
  deliveryHeadEmployeeId?: number | null;
}
/** No projectTypeId here on purpose - changing a project's type after
 * creation isn't supported from this form (Modules/Tasks it already
 * generated would need reconciling; not something admin does casually). */
export interface UpdateProjectRequest {
  accountId?: number;
  code?: string;
  name?: string;
  defaultBillable?: boolean;
  isActive?: boolean;
  projectTech?: string | null;
  billingType?: string | null;
  customerPO?: string | null;
  notes?: string | null;
  projectLeadEmployeeId?: number | null;
  projectManagerEmployeeId?: number | null;
  deliveryHeadEmployeeId?: number | null;
}

export interface CreateModuleRequest {
  projectId: number;
  name: string;
  projectTypeId: number | null;
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

// ---- "Others" quick-add (Add Task Line, employee-reachable) ----

/** Employee picked "Others" for Project and typed a name. Creates a real,
 * immediately-usable Project: placeholder code, flagged needsReview so
 * admin can fill in the real Account/Code/BillingType/ProjectType later. */
export interface QuickAddProjectRequest {
  name: string;
}
/** Employee picked "Others" for Module. Not part of any Project Type's
 * template - projectTypeId stays null on the created Module. */
export interface QuickAddModuleRequest {
  projectId: number;
  name: string;
}
export interface QuickAddTaskRequest {
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