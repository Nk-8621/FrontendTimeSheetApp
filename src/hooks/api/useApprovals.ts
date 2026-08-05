import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../../api/approvals';

export function useValidateWeek(employeeCode: string | undefined, weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: ['validate', employeeCode, weekStart],
    queryFn: () => approvalsApi.validate(employeeCode!, weekStart),
    enabled: Boolean(employeeCode) && enabled,
  });
}

export function useApprovalMutations(employeeCode: string | undefined, weekStart: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['week', employeeCode, weekStart] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
  };

  const submit = useMutation({
    mutationFn: () => approvalsApi.submit(employeeCode!, weekStart),
    onSuccess: invalidate,
  });

  const recall = useMutation({
    mutationFn: () => approvalsApi.recall(employeeCode!, weekStart),
    onSuccess: invalidate,
  });

  const approveLevel1 = useMutation({
    mutationFn: () => approvalsApi.approveLevel1(employeeCode!, weekStart),
    onSuccess: invalidate,
  });

  const approveLevel2 = useMutation({
    mutationFn: () => approvalsApi.approveLevel2(employeeCode!, weekStart),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (reason: string) => approvalsApi.reject(employeeCode!, weekStart, reason),
    onSuccess: invalidate,
  });

  return { submit, recall, approveLevel1, approveLevel2, reject };
}

export function usePendingApprovals(level2: boolean) {
  return useQuery({
    queryKey: ['pending-approvals', level2],
    queryFn: () => approvalsApi.getPending(level2),
  });
}

/** The full-detail queue — flags, line-level breakdown, billable split —
 * backing the Approvals screen. */
export function useApprovalQueue(level2: boolean) {
  return useQuery({
    queryKey: ['approval-queue', level2],
    queryFn: () => approvalsApi.getQueue(level2),
  });
}