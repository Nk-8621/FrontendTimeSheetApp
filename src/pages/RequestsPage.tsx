import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Banner } from '../components/timesheet/Banner';
import { StatusPill } from '../components/ui/StatusPill';
import { NewRequestDrawer } from '../components/requests/NewRequestDrawer';
import { useUI } from '../components/ui/UIProvider';
import { useSession } from '../session/SessionContext';
import { useMyDayTypeRequests, useDayTypeRequestMutations } from '../hooks/api/useDayTypeRequests';
import { ApiError } from '../api/httpClient';
import { DAY_TYPE_REQUEST_LABELS, DAY_TYPE_REQUEST_STATUS_LABELS } from '../types/meridian';
import { dayMonth } from '../lib/dates';
import controls from '../styles/controls.module.css';
import styles from '../components/requests/RequestList.module.css';

export function RequestsPage() {
  const { employeeCode } = useSession();
  const { openDrawer, closeDrawer, toast } = useUI();
  const { data: requests, isLoading, isError } = useMyDayTypeRequests(employeeCode);
  const mutations = useDayTypeRequestMutations(employeeCode);

  function handleNewRequest() {
    openDrawer({
      title: 'Request WFH or Leave',
      body: (
        <NewRequestDrawer
          onCancel={closeDrawer}
          onSave={(data) => {
            mutations.submit.mutate(data, {
              onSuccess: () => { closeDrawer(); toast('Request submitted — awaiting your manager', 'ok'); },
              onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not submit request', 'bad'),
            });
          }}
        />
      ),
    });
  }

  return (
    <>
      <PageHeader crumb="My Work" title="Requests">
        <button className={`${controls.btn} ${controls.pri} ${controls.sm}`} onClick={handleNewRequest}>
          + New request
        </button>
      </PageHeader>

      <div className="page-content">
        <Banner>
          Request WFH or Leave for a single day. It takes effect immediately — shown as Pending until your Level 1
          manager approves or rejects it. A rejection reverts the day automatically.
        </Banner>

        {isLoading && <Banner>Loading your requests…</Banner>}
        {isError && <Banner kind="reject">Couldn't load your requests — check that the backend API is reachable.</Banner>}

        {requests && (
          <Card title="Your requests" noPad>
            {requests.length === 0 ? (
              <div className={styles.empty}>No requests yet — use "+ New request" above to ask for WFH or Leave.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th>Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{dayMonth(r.requestDate)}</td>
                      <td>{DAY_TYPE_REQUEST_LABELS[r.requestType] ?? r.requestType}</td>
                      <td><StatusPill status={r.status} labels={DAY_TYPE_REQUEST_STATUS_LABELS} /></td>
                      <td className={styles.note}>{r.note ?? '—'}</td>
                      <td className={styles.note}>
                        {r.status === 'Pending' ? '—' : r.approverName ?? '—'}
                        {r.decisionComment && <div>{r.decisionComment}</div>}
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
