import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Banner } from '../components/timesheet/Banner';
import { RejectRequestDrawer } from '../components/requests/RejectRequestDrawer';
import { useUI } from '../components/ui/UIProvider';
import { useDayTypeRequestQueue, useDayTypeRequestMutations } from '../hooks/api/useDayTypeRequests';
import { useSession } from '../session/SessionContext';
import { ApiError } from '../api/httpClient';
import { DAY_TYPE_REQUEST_LABELS } from '../types/meridian';
import { dayMonth } from '../lib/dates';
import controls from '../styles/controls.module.css';
import styles from '../components/requests/RequestList.module.css';

export function RequestApprovalPage() {
  const { employeeCode } = useSession();
  const { openDrawer, closeDrawer, toast } = useUI();
  const { data: queue, isLoading, isError } = useDayTypeRequestQueue();
  const mutations = useDayTypeRequestMutations(employeeCode);

  function handleApprove(requestId: number) {
    mutations.approve.mutate(requestId, {
      onSuccess: () => toast('Request approved', 'ok'),
      onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not approve request', 'bad'),
    });
  }

  function handleReject(requestId: number, employeeName: string) {
    openDrawer({
      title: `Reject ${employeeName}'s request`,
      body: (
        <RejectRequestDrawer
          employeeName={employeeName}
          onCancel={closeDrawer}
          onConfirm={(comment) => {
            mutations.reject.mutate({ requestId, comment }, {
              onSuccess: () => { closeDrawer(); toast('Request rejected — the day has been reverted'); },
              onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not reject request', 'bad'),
            });
          }}
        />
      ),
    });
  }

  return (
    <>
      <PageHeader crumb="Approvals" title="Request Approval" />

      <div className="page-content">
        <Banner kind="warn">
          <b>Level 1 — reporting lead / project manager.</b> These requests already took effect on the employee's
          timesheet. Rejecting one reverts that day back to normal automatically.
        </Banner>

        {isLoading && <Banner>Loading the queue…</Banner>}
        {isError && <Banner kind="reject">Couldn't load the request queue — check that the backend API is reachable.</Banner>}

        {queue && (
          <Card title={`Pending requests (${queue.length})`} noPad>
            {queue.length === 0 ? (
              <div className={styles.empty}>Nothing waiting on your approval right now.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {queue.map((r) => (
                    <tr key={r.id}>
                      <td>{r.employeeName}</td>
                      <td>{dayMonth(r.requestDate)}</td>
                      <td>{DAY_TYPE_REQUEST_LABELS[r.requestType] ?? r.requestType}</td>
                      <td className={styles.note}>{r.note ?? '—'}</td>
                      <td className={styles.actions}>
                        <button className={`${controls.btn} ${controls.ok} ${controls.sm}`} onClick={() => handleApprove(r.id)}>
                          Approve
                        </button>
                        <button className={`${controls.btn} ${controls.dgr} ${controls.sm}`} onClick={() => handleReject(r.id, r.employeeName)}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
