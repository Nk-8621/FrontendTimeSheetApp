import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weekOffsApi } from '../../api/weekOffs';
import type { SaveEmployeeWeekOffRequest } from '../../api/types';

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

  const create = useMutation({
    mutationFn: (body: SaveEmployeeWeekOffRequest) => weekOffsApi.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SaveEmployeeWeekOffRequest }) => weekOffsApi.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => weekOffsApi.remove(id),
    onSuccess: invalidate,
  });
  const importFile = useMutation({
    mutationFn: (file: File) => weekOffsApi.importFile(file),
    onSuccess: (result) => { if (result.imported > 0) invalidate(); },
  });

  return { create, update, remove, importFile };
}
