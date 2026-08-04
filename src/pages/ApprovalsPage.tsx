import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { ApprovalQueueRow } from '../components/approvals/ApprovalQueueRow';
import { usePendingApprovals } from '../hooks/api/useApprovals';
import styles from '../components/approvals/ApprovalQueue.module.css';

interface ApprovalsPageProps {
  level2: boolean;
  title: string;
}

export function ApprovalsPage({ level2, title }: ApprovalsPageProps) {
  const { data: pending, isLoading, isError } = usePendingApprovals(level2);

  return (
    <>
      <PageHeader crumb="Approvals" title={title} />
      <div className="page-content">
        {isLoading && <Banner>Loading the queue…</Banner>}
        {isError && <Banner kind="reject">Couldn't load the approval queue — check that the backend API is reachable.</Banner>}

        {pending && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Week</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Billable</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.empty}>Nothing waiting on you right now.</div>
                  </td>
                </tr>
              ) : (
                pending.map((item) => (
                  <ApprovalQueueRow key={`${item.employeeCode}-${item.weekStartDate}`} item={item} level2={level2} />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
