import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { WeekNav } from '../components/timesheet/WeekNav';
import { ApprovalQueueItem } from '../components/approvals/ApprovalQueueItem';
import { useApprovalQueue } from '../hooks/api/useApprovals';
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
  const { data: queue, isLoading, isError } = useApprovalQueue(level2);
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
  const pctBillable = totalHours ? Math.round((billableHours / totalHours) * 100) : 0;

  const otherWeeksCount = (queue?.length ?? 0) - weekQueue.length;

  async function handleBulkApprove() {
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
    if (succeeded < clean.length) toast(`${clean.length - succeeded} could not be approved - please check them individually`, 'bad');
  }

  return (
    <>
      <PageHeader crumb="Approvals" title={title}>
        <WeekNav weekStart={selectedWeek} onShift={shiftWeek} />
        {clean.length > 0 && (
          <button className={`${controls.btn} ${controls.ok} ${controls.sm}`} onClick={handleBulkApprove}>
            Approve {clean.length} with no flags
          </button>
        )}
      </PageHeader>
      <div className="page-content">
        <Banner kind={level2 ? undefined : 'warn'}>
          {level2
            ? <><b>Level 2 - delivery head.</b> These weeks already cleared Level 1. Your approval locks the week.</>
            : <><b>Level 1 - reporting lead / project manager.</b> You are approving that the effort is real and correctly attributed. Approved weeks move to Level 2.</>}
        </Banner>

        {otherWeeksCount > 0 && (
          <Banner kind="warn">
            <b>{otherWeeksCount} more timesheet{otherWeeksCount > 1 ? 's are' : ' is'} pending from other weeks</b> - use the week selector above to check them too.
          </Banner>
        )}

        {isLoading && <Banner>Loading the queue...</Banner>}
        {isError && <Banner kind="reject">Couldn't load the approval queue - check that the backend API is reachable.</Banner>}

        {queue && (
          <>
            <div className={kpiStyles.kpis}>
              <div className={`${kpiStyles.kpi} ${kpiStyles.w}`}>
                <div className={kpiStyles.k}>Awaiting you</div>
                <div className={kpiStyles.v}>{weekQueue.length}</div>
                <div className={kpiStyles.d}>this week{otherWeeksCount > 0 ? ` - ${queue.length} total across all weeks` : ''}</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.a}`}>
                <div className={kpiStyles.v}>{totalHours.toFixed(1)}<small> h</small></div>
                <div className={kpiStyles.k} style={{ order: -1, marginBottom: 3 }}>Hours in queue</div>
                <div className={kpiStyles.d}>{pctBillable}% billable</div>
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
                {dayMonth(selectedWeek)} - {dayMonth(addDays(selectedWeek, 6))}
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>Click a row to see the hours behind it</span>
            </div>

            {weekQueue.length === 0 ? (
              <div className={styles.table}>
                <div className={styles.empty}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Nothing pending for this week</div>
                  {otherWeeksCount > 0
                    ? `${otherWeeksCount} timesheet${otherWeeksCount > 1 ? 's are' : ' is'} still pending from another week - use the arrows above to find it.`
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