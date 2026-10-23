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
    mutationFn: (comment?: string) => approvalsApi.approveLevel1(employeeCode!, weekStart, comment),
    onSuccess: invalidate,
  });

  const approveLevel2 = useMutation({
    mutationFn: (comment?: string) => approvalsApi.approveLevel2(employeeCode!, weekStart, comment),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (reason: string) => approvalsApi.reject(employeeCode!, weekStart, reason),
    onSuccess: invalidate,
  });

  return { submit, recall, approveLevel1, approveLevel2, reject };
}

/** `enabled` lets the sidebar skip this (server-side, fairly heavy) lookup
 * for anyone who doesn't have that approval screen at all. */
export function usePendingApprovals(level2: boolean, enabled = true) {
  return useQuery({
    queryKey: ['pending-approvals', level2],
    queryFn: () => approvalsApi.getPending(level2),
    enabled,
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

export function useWeekDetail(employeeCode: string, weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: ['week-detail', employeeCode, weekStart],
    queryFn: () => approvalsApi.getWeekDetail(employeeCode, weekStart),
    enabled,
  });
}
