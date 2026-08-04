import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';

export function useEmployee(employeeCode: string | undefined) {
  return useQuery({
    queryKey: ['employee', employeeCode],
    queryFn: () => employeesApi.getByCode(employeeCode!),
    enabled: Boolean(employeeCode),
  });
}

export function useManager(employeeCode: string | undefined) {
  return useQuery({
    queryKey: ['employee', employeeCode, 'manager'],
    queryFn: () => employeesApi.getManager(employeeCode!),
    enabled: Boolean(employeeCode),
    retry: false, // 404 (no manager) is an expected outcome, not a transient failure
  });
}

/** Manager's manager (the Level 2 approver) — a dependent query chained off
 * the direct manager, since the backend doesn't store this as a fixed column. */
export function useSkipManager(employeeCode: string | undefined) {
  const manager = useManager(employeeCode);
  const skipManager = useQuery({
    queryKey: ['employee', employeeCode, 'skip-manager'],
    queryFn: () => employeesApi.getManager(manager.data!.employeeCode),
    enabled: Boolean(manager.data?.employeeCode),
    retry: false,
  });
  return skipManager;
}
