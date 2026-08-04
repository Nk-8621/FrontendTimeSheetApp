// UI-only display config. The actual data shapes (Employee, TimeEntry,
// WeekRecord, etc.) now come from the backend — see src/api/types.ts.
// What lives here is purely "how do we label/group things on screen."

export type RoleId = 'EMP' | 'LEAD' | 'L2' | 'ADMIN';

export const NAV_GROUPS: Record<string, { group: string; icon: string; title: string }> = {
  ts: { group: 'My Work', icon: '▤', title: 'My Timesheet' },
  hist: { group: 'My Work', icon: '❐', title: 'My Timesheets' },
  ap1: { group: 'Approvals', icon: '✓', title: 'Level 1 Approvals' },
  ap2: { group: 'Approvals', icon: '✓✓', title: 'Level 2 Approvals' },
  team: { group: 'Oversight', icon: '▦', title: 'Team Compliance' },
  rep: { group: 'Oversight', icon: '◫', title: 'Reports' },
  mast: { group: 'Setup', icon: '⚙', title: 'Master Data' },
  notif: { group: 'Setup', icon: '◔', title: 'Notifications' },
};

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const STANDARD_HOURS_PER_DAY = 8;

export const DAY_TYPE_LABELS: Record<string, { css: string; label: string }> = {
  W: { css: '', label: 'Working' },
  WFH: { css: 'wfh', label: 'WFH' },
  L: { css: 'lv', label: 'Leave' },
  H: { css: 'hd', label: 'Holiday' },
  O: { css: '', label: 'Weekly Off' },
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