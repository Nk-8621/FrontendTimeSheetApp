import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weekOffsApi } from '../../api/weekOffs';
import type { AssignEmployeesRequest, SaveClientWeekOffRequest, UpdateEmployeeWeekOffRequest } from '../../api/types';

// WEEK OFFS (Nov 2026): Master Data -> Week Offs.

export function useWeekOffs() {
  return useQuery({ queryKey: ['week-offs'], queryFn: weekOffsApi.getAll });
}

export function useWeekOffOptions() {
  return useQuery({ queryKey: ['week-off-options'], queryFn: weekOffsApi.getOptions, staleTime: 5 * 60 * 1000 });
}

export function useWeekOffMutations() {
  const queryClient = useQueryClient();
  // Week offs change which days are W-OFF, so timesheet screens refresh too.
  const invalidate = () => queryClient.invalidateQueries();

  const createClient = useMutation({
    mutationFn: (body: SaveClientWeekOffRequest) => weekOffsApi.createClient(body),
    onSuccess: invalidate,
  });
  const updateClient = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SaveClientWeekOffRequest }) => weekOffsApi.updateClient(id, body),
    onSuccess: invalidate,
  });
  const removeClient = useMutation({
    mutationFn: (id: number) => weekOffsApi.removeClient(id),
    onSuccess: invalidate,
  });
  const assignEmployees = useMutation({
    mutationFn: (body: AssignEmployeesRequest) => weekOffsApi.assignEmployees(body),
    onSuccess: invalidate,
  });
  const updateEmployee = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateEmployeeWeekOffRequest }) => weekOffsApi.updateEmployee(id, body),
    onSuccess: invalidate,
  });
  const removeEmployee = useMutation({
    mutationFn: (id: number) => weekOffsApi.removeEmployee(id),
    onSuccess: invalidate,
  });
  const importFile = useMutation({
    mutationFn: (file: File) => weekOffsApi.importFile(file),
    onSuccess: (result) => { if (result.imported > 0) invalidate(); },
  });

  return { createClient, updateClient, removeClient, assignEmployees, updateEmployee, removeEmployee, importFile };
}
