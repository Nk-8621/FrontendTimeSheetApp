import type { WeekRecordDto } from '../../api/types';
import { useEmployee } from '../../hooks/api/useEmployees';
import { useWeek } from '../../hooks/api/useTimesheet';
import { useApprovalMutations } from '../../hooks/api/useApprovals';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import { dayMonth, addDays } from '../../lib/dates';
import { RejectDrawer } from './RejectDrawer';
import controls from '../../styles/controls.module.css';
import styles from './ApprovalQueue.module.css';

interface ApprovalQueueRowProps {
  item: WeekRecordDto;
  level2: boolean;
}

export function ApprovalQueueRow({ item, level2 }: ApprovalQueueRowProps) {
  const { data: employee } = useEmployee(item.employeeCode);
  const { data: week } = useWeek(item.employeeCode, item.weekStartDate);
  const mutations = useApprovalMutations(item.employeeCode, item.weekStartDate);
  const { openDrawer, closeDrawer, toast } = useUI();

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function handleApprove() {
    const mutation = level2 ? mutations.approveLevel2 : mutations.approveLevel1;
    mutation.mutate(undefined, {
      onSuccess: () => toast(`${employee?.fullName ?? 'Week'} approved`, 'ok'),
      onError: (err) => showError(err, 'Could not approve this week'),
    });
  }

  function handleReject() {
    openDrawer({
      title: 'Return for correction',
      body: (
        <RejectDrawer
          employeeName={employee?.fullName ?? 'this employee'}
          onCancel={closeDrawer}
          onConfirm={(reason) => {
            mutations.reject.mutate(reason, {
              onSuccess: () => { closeDrawer(); toast('Week returned for correction'); },
              onError: (err) => showError(err, 'Could not return this week'),
            });
          }}
        />
      ),
    });
  }

  const isBusy = mutations.approveLevel1.isPending || mutations.approveLevel2.isPending || mutations.reject.isPending;

  return (
    <tr>
      <td>
        <div className={styles.name}>{employee?.fullName ?? '…'}</div>
        <div className={styles.desig}>{employee?.designation}</div>
      </td>
      <td className="num">{dayMonth(item.weekStartDate)} – {dayMonth(addDays(item.weekStartDate, 6))}</td>
      <td className="num" style={{ textAlign: 'right' }}>{week ? week.totalHours.toFixed(1) : '…'} h</td>
      <td className="num" style={{ textAlign: 'right' }}>{week ? week.billableHours.toFixed(1) : '…'} h</td>
      <td style={{ textAlign: 'right' }}>
        <button className={`${controls.btn} ${controls.ok} ${controls.sm}`} disabled={isBusy} onClick={handleApprove}>
          Approve
        </button>
        <button className={`${controls.btn} ${controls.dgr} ${controls.sm}`} disabled={isBusy} onClick={handleReject} style={{ marginLeft: 6 }}>
          Return
        </button>
      </td>
    </tr>
  );
}
