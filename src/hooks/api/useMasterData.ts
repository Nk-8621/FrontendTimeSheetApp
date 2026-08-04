import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '../../api/masterData';

// Reference data changes rarely — cached for 5 minutes so switching screens
// doesn't re-fetch departments/projects/etc. every time.
const STALE_TIME_MS = 5 * 60 * 1000;

export function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: masterDataApi.getDepartments, staleTime: STALE_TIME_MS });
}

export function useLocations() {
  return useQuery({ queryKey: ['locations'], queryFn: masterDataApi.getLocations, staleTime: STALE_TIME_MS });
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: masterDataApi.getAccounts, staleTime: STALE_TIME_MS });
}

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: masterDataApi.getProjects, staleTime: STALE_TIME_MS });
}

export function useModules(projectId?: number) {
  return useQuery({
    queryKey: ['modules', projectId ?? 'all'],
    queryFn: () => masterDataApi.getModules(projectId),
    staleTime: STALE_TIME_MS,
  });
}

export function useTasks(moduleId?: number) {
  return useQuery({
    queryKey: ['tasks', moduleId ?? 'all'],
    queryFn: () => masterDataApi.getTasks(moduleId),
    staleTime: STALE_TIME_MS,
  });
}
