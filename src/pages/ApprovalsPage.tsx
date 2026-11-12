import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { WeekNav } from '../components/timesheet/WeekNav';
import { ApprovalQueueItem } from '../components/approvals/ApprovalQueueItem';
import { useApprovalQueue, useReturnedByLevel2 } from '../hooks/api/useApprovals';
import { useUI } from '../components/ui/UIProvider';
import { approvalsApi } from '../api/approvals';
import { dayMonth, addDays, mondayOf, toISO } from '../lib/dates';
import controls from '../styles/controls.module.css';
import kpiStyles from '../components/timesheet/KpiStrip.module.css';
import styles from '../components/approvals/ApprovalQueue.module.css';

interface ApprovalsPageProps {
  level2: boolean;
  title: string;
}

export function ApprovalsPage({ level2, title }: ApprovalsPageProps) {
  const { data: queue, isError } = useApprovalQueue(level2);
  // Level 1 only: weeks you approved that Level 2 sent back to the employee.
  const { data: returned, isError: returnedError } = useReturnedByLevel2(!level2);
  const [tab, setTab] = useState<'pending' | 'returned'>('pending');
  const showReturned = !level2 && tab === 'returned';
  const { toast } = useUI();
  const queryClient = useQueryClient();

  // Always exactly one week selected - same pattern as My Timesheet, Team
  // Compliance, and Reports. Defaults to the current week regardless of
  // whether it's empty - an approver's mental model is "what do I need to
  // deal with right now," and the "other weeks pending" banner below
  // handles making sure backlog elsewhere is never completely silent.
  const [selectedWeek, setSelectedWeek] = useState(() => mondayOf(toISO(new Date())));

  const shiftWeek = (direction: -1 | 1) => {
    setSelectedWeek((w) => addDays(w, direction * 7));
  };

  const weekQueue = queue?.filter((q) => q.weekStartDate === selectedWeek) ?? [];
  const flagged = weekQueue.filter((q) => q.flags.length > 0);
  const clean = weekQueue.filter((q) => q.flags.length === 0);
  const totalHours = weekQueue.reduce((sum, q) => sum + q.totalHours, 0);
  const billableHours = weekQueue.reduce((sum, q) => sum + q.billableHours, 0);
  const partialBillableHours = weekQueue.reduce((sum, q) => sum + q.partialBillableHours, 0);
  const pctBillable = totalHours ? Math.round((billableHours / totalHours) * 100) : 0;
  const pctPartialBillable = totalHours ? Math.round((partialBillableHours / totalHours) * 100) : 0;

  const otherWeeksCount = (queue?.length ?? 0) - weekQueue.length;

  async function handleBulkApprove() {
    // Approval can't be undone from the UI (Level 2 also locks the week), so
    // a one-click bulk action gets the same confirm step as other
    // irreversible actions here.
    const names = clean.map((c) => c.fullName).join(', ');
    if (!window.confirm(`Approve ${clean.length} timesheet${clean.length > 1 ? 's' : ''} at Level ${level2 ? 2 : 1} for ${dayMonth(selectedWeek)} – ${dayMonth(addDays(selectedWeek, 6))}?\n\n${names}`)) return;
    let succeeded = 0;
    for (const item of clean) {
      try {
        if (level2) await approvalsApi.approveLevel2(item.employeeCode, item.weekStartDate);
        else await approvalsApi.approveLevel1(item.employeeCode, item.weekStartDate);
        succeeded++;
      } catch {
        // continue with the rest; we report how many actually succeeded below
      }
    }
    queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    if (succeeded > 0) toast(`${succeeded} timesheet${succeeded > 1 ? 's' : ''} approved at Level ${level2 ? 2 : 1}`, 'ok');
    if (succeeded < clean.length) toast(`${clean.length - succeeded} could not be approved — please check them individually`, 'bad');
  }

  return (
    <>
      <PageHeader title={title}>
        {!showReturned && <WeekNav weekStart={selectedWeek} onShift={shiftWeek} />}
        {!showReturned && clean.length > 0 && (
          <button className={`${controls.btn} ${controls.ok} ${controls.sm}`} onClick={handleBulkApprove}>
            Approve {clean.length} with no flags
          </button>
        )}
      </PageHeader>
      <div className="page-content">
        {isError && <Banner kind="reject">Couldn't load the approval queue — check that the backend API is reachable.</Banner>}

        {!level2 && (
          <div className={styles.tabs}>
            <button className={tab === 'pending' ? styles.tabOn : ''} onClick={() => setTab('pending')}>
              Pending
            </button>
            <button className={tab === 'returned' ? styles.tabOn : ''} onClick={() => setTab('returned')}>
              Returned by Level 2{returned && returned.length > 0 ? ` (${returned.length})` : ''}
            </button>
          </div>
        )}

        {showReturned && (
          <>
            {returnedError && <Banner kind="reject">Couldn't load the returned timesheets — check that the backend API is reachable.</Banner>}
            <p style={{ fontSize: 12, color: 'var(--slate)', margin: '0 0 10px' }}>
              Timesheets you approved that Level 2 sent back to the employee. Once the employee fixes and resubmits, they move back to Pending.
            </p>
            {returned && returned.length === 0 && (
              <div className={styles.table}>
                <div className={styles.empty}>Nothing has been returned by Level 2.</div>
              </div>
            )}
            {returned && returned.length > 0 && (
              <div className={styles.queue}>
                {returned.map((item) => (
                  <ApprovalQueueItem key={`${item.employeeCode}-${item.weekStartDate}`} item={item} level2={false} readOnly />
                ))}
              </div>
            )}
          </>
        )}

        {!showReturned && queue && (
          <>
            <div className={kpiStyles.kpis}>
              <div className={`${kpiStyles.kpi} ${kpiStyles.w}`}>
                <div className={kpiStyles.k}>Awaiting you</div>
                <div className={kpiStyles.v}>{weekQueue.length}</div>
                <div className={kpiStyles.d}>this week{otherWeeksCount > 0 ? ` — ${queue.length} total across all weeks` : ''}</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.a}`}>
                <div className={kpiStyles.v}>{totalHours.toFixed(1)}<small> h</small></div>
                <div className={kpiStyles.k} style={{ order: -1, marginBottom: 3 }}>Hours in queue</div>
                <div className={kpiStyles.d}>{pctBillable}% billable · {pctPartialBillable}% partial</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.r}`}>
                <div className={kpiStyles.k}>With flags</div>
                <div className={kpiStyles.v}>{flagged.length}</div>
                <div className={kpiStyles.d}>need a closer look</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.g}`}>
                <div className={kpiStyles.k}>No flags</div>
                <div className={kpiStyles.v}>{clean.length}</div>
                <div className={kpiStyles.d}>safe to bulk approve</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--slate)' }}>
                {dayMonth(selectedWeek)} – {dayMonth(addDays(selectedWeek, 6))}
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>Click a row to see the hours behind it</span>
            </div>

            {weekQueue.length === 0 ? (
              <div className={styles.table}>
                <div className={styles.empty}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Nothing pending for this week</div>
                  {otherWeeksCount > 0
                    ? `${otherWeeksCount} timesheet${otherWeeksCount > 1 ? 's are' : ' is'} still pending from another week — use the arrows above to find it.`
                    : 'Nothing is waiting on your approval right now.'}
                </div>
              </div>
            ) : (
              <div className={styles.queue}>
                {weekQueue.map((item) => (
                  <ApprovalQueueItem key={`${item.employeeCode}-${item.weekStartDate}`} item={item} level2={level2} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
