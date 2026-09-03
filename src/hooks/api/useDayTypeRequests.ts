import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dayTypeRequestsApi } from '../../api/dayTypeRequests';
import type { CreateDayTypeRequestRequest } from '../../api/types';

export function useMyDayTypeRequests(employeeCode: string | undefined) {
  return useQuery({
    queryKey: ['day-type-requests', 'mine', employeeCode],
    queryFn: () => dayTypeRequestsApi.getMine(employeeCode!),
    enabled: Boolean(employeeCode),
  });
}

export function useDayTypeRequestQueue() {
  return useQuery({
    queryKey: ['day-type-requests', 'queue'],
    queryFn: () => dayTypeRequestsApi.getQueue(),
  });
}

export function useDayTypeRequestMutations(employeeCode: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['day-type-requests'] });
    queryClient.invalidateQueries({ queryKey: ['week'] });
  };

  const submit = useMutation({
    mutationFn: (body: CreateDayTypeRequestRequest) => dayTypeRequestsApi.submit(employeeCode!, body),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: (requestId: number) => dayTypeRequestsApi.approve(requestId),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ requestId, comment }: { requestId: number; comment: string | null }) =>
      dayTypeRequestsApi.reject(requestId, comment),
    onSuccess: invalidate,
  });

  return { submit, approve, reject };
}
