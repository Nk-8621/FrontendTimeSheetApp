import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetImportApi } from '../../api/timesheetImport';

export function useImportTimesheetExcel(employeeCode: string, weekStart: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => timesheetImportApi.importWeek(employeeCode, weekStart, file),
    onSuccess: () => {
      // Same query key useWeek() reads — the grid picks up the newly
      // imported lines automatically once this refetches.
      queryClient.invalidateQueries({ queryKey: ['week', employeeCode, weekStart] });
    },
  });
}