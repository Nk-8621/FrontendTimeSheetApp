import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timesheetApi } from '../../api/timesheet';
import type { CreateTimeEntryRequest, UpdateTimeEntryRequest } from '../../api/types';

const weekKey = (employeeCode: string, weekStart: string) => ['week', employeeCode, weekStart];

export function useWeek(employeeCode: string | undefined, weekStart: string) {
  return useQuery({
    queryKey: weekKey(employeeCode ?? '', weekStart),
    queryFn: () => timesheetApi.getWeek(employeeCode!, weekStart),
    enabled: Boolean(employeeCode),
  });
}

export function useTimesheetHistory(employeeCode: string | undefined) {
  return useQuery({
    queryKey: ['timesheet-history', employeeCode],
    queryFn: () => timesheetApi.getHistory(employeeCode!),
    enabled: Boolean(employeeCode),
  });
}

/** All the timesheet mutations for one employee/week, bundled together since
 * they all need to invalidate the same query on success. */
export function useTimesheetMutations(employeeCode: string | undefined, weekStart: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: weekKey(employeeCode ?? '', weekStart) });

  const addEntry = useMutation({
    mutationFn: (body: CreateTimeEntryRequest) => timesheetApi.addEntry(employeeCode!, weekStart, body),
    onSuccess: invalidate,
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTimeEntryRequest }) => timesheetApi.updateEntry(id, body),
    onSuccess: invalidate,
  });

  const removeEntry = useMutation({
    mutationFn: (id: number) => timesheetApi.removeEntry(id),
    onSuccess: invalidate,
  });

  const setDayType = useMutation({
    mutationFn: ({ date, dayType }: { date: string; dayType: string }) =>
      timesheetApi.setDayType(employeeCode!, date, dayType),
    onSuccess: invalidate,
  });

  const copyLastWeek = useMutation({
    mutationFn: () => timesheetApi.copyLastWeek(employeeCode!, weekStart),
    onSuccess: invalidate,
  });

  return { addEntry, updateEntry, removeEntry, setDayType, copyLastWeek };
}