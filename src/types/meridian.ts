// UI-only display config. The actual data shapes (Employee, TimeEntry,
// WeekRecord, etc.) now come from the backend — see src/api/types.ts.
// What lives here is purely "how do we label/group things on screen."

export type RoleId = 'EMP' | 'LEAD' | 'L2' | 'ADMIN';

export const NAV_GROUPS: Record<string, { group: string; icon: string; title: string }> = {
  stories: { group: 'My Work', icon: '◎', title: 'User Stories' },
  ts: { group: 'My Work', icon: '▤', title: 'My Timesheet' },
  hist: { group: 'My Work', icon: '❐', title: 'All Timesheets' },
  req: { group: 'My Work', icon: '✋', title: 'Requests' },
  ap1: { group: 'Approvals', icon: '✓', title: 'Level 1 Approvals' },
  ap2: { group: 'Approvals', icon: '✓✓', title: 'Level 2 Approvals' },
  reqap: { group: 'Approvals', icon: '✋✓', title: 'Request Approval' },
  team: { group: 'Oversight', icon: '▦', title: 'Team Compliance' },
  rep: { group: 'Oversight', icon: '◫', title: 'Reports' },
  mast: { group: 'Setup', icon: '⚙', title: 'Master Data' },
  notif: { group: 'Notifications', icon: '◔', title: 'Notifications' },
};

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Most hours one task line can hold on one day (same as
 *  TimeEntryRules.MaxHoursPerLinePerDay on the backend). */
export const MAX_HOURS_PER_LINE = 8;
export const STANDARD_HOURS_PER_DAY = 8;

/** The one wording for billing classification across every screen. */
export const CLASSIFICATION_LABELS: Record<string, string> = {
  Billable: 'Billable',
  NonBillable: 'Non-billable',
  PartialBillable: 'Partial billable',
};

/** Shorter versions for narrow table cells (week grid, approval detail). */
export const CLASSIFICATION_SHORT_LABELS: Record<string, string> = {
  Billable: 'Billable',
  NonBillable: 'Non-bill',
  PartialBillable: 'Partial',
};

export const DAY_TYPE_LABELS: Record<string, { css: string; label: string }> = {
  W: { css: '', label: 'Working' },
  WFH: { css: 'wfh', label: 'WFH' },
  L: { css: 'lv', label: 'Leave' },
  LH: { css: 'lv', label: 'Half-day Leave' },
  H: { css: 'hd', label: 'Holiday' },
  O: { css: '', label: 'W-OFF' }, // same label on every screen
  OD: { css: 'od', label: 'On Duty' },
};

export const DAY_TYPE_REQUEST_LABELS: Record<string, string> = {
  WFH: 'WFH',
  LeaveFirstHalf: 'Paid Leave - First Half',
  LeaveSecondHalf: 'Paid Leave - Second Half',
  LeaveFull: 'Paid Leave - Full Day',
  OnDuty: 'On Duty',
  CompOffFirstHalf: 'Comp-Off - First Half',
  CompOffSecondHalf: 'Comp-Off - Second Half',
  CompOffFull: 'Comp-Off - Full Day',
  UnpaidFirstHalf: 'Unpaid Leave - First Half',
  UnpaidSecondHalf: 'Unpaid Leave - Second Half',
  UnpaidFull: 'Unpaid Leave - Full Day',
};

export const DAY_TYPE_REQUEST_STATUS_LABELS: Record<string, { css: string; label: string }> = {
  Pending: { css: 'p-l1', label: 'Pending' },
  Approved: { css: 'p-ok', label: 'Approved' },
  Rejected: { css: 'p-rej', label: 'Rejected' },
};

// Active/Inactive appeared as separate hand-rolled `style={{color}}` spots
// across the Master Data screen (Projects, Resources) before this — same
// StatusPill component and vocabulary as every other status in the app.
export const ACTIVE_STATUS_LABELS: Record<string, { css: string; label: string }> = {
  Active: { css: 'p-ok', label: 'Active' },
  Inactive: { css: 'p-draft', label: 'Inactive' },
};

// Keys match the backend's WeekStatusDto strings exactly (PendingL1/L2, not l1/l2).
export const WEEK_STATUS_LABELS: Record<string, { css: string; label: string }> = {
  NotStarted: { css: 'p-rej', label: 'Not Started' },
  Draft: { css: 'p-draft', label: 'Draft' },
  PendingL1: { css: 'p-l1', label: 'Pending Level 1' },
  PendingL2: { css: 'p-l2', label: 'Pending Level 2' },
  Approved: { css: 'p-ok', label: 'Approved & Locked' },
  Rejected: { css: 'p-rej', label: 'Returned for Correction' },
};

/** WEEK OFFS (Nov 2026): a W-OFF day needs no hours, but up to this many can
 * be logged there as extra work (the backend allows the same). */
export const W_OFF_EXTRA_HOURS = 8;

/** Most hours a day can hold across all lines: its capacity, or the extra
 * allowance on a W-OFF day. */
export function dayEntryLimit(day: { dayType: string; capacityHours: number }) {
  return day.dayType === 'O' ? W_OFF_EXTRA_HOURS : day.capacityHours;
}

/** DAY STATUS (Nov 2026): the choices for a day's status, picked in the Add Task drawer. */
export const DAY_STATUS_OPTIONS: [string, string][] = [
  ['W', 'Working'],
  ['L', 'Leave'],
  ['WFH', 'WFH'],
];
