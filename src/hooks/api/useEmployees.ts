import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';

/** Every employee — backs the Master Data "Resources" tab (read-only). */
export function useAllEmployees() {
  return useQuery({ queryKey: ['employees', 'all'], queryFn: employeesApi.getAll, staleTime: 5 * 60 * 1000 });
}

/** RBAC — what this employee is actually allowed to see, computed server-side
 * from their real position in the org hierarchy. This is the source of truth
 * for navigation; SessionContext consumes it directly. */
export function useAccessProfile(employeeCode: string | undefined) {
  return useQuery({
    queryKey: ['employee', employeeCode, 'access'],
    queryFn: () => employeesApi.getAccess(employeeCode!),
    enabled: Boolean(employeeCode),
  });
}

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