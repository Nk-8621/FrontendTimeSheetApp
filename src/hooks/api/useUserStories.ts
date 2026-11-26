import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectStoriesApi, userStoriesApi } from '../../api/userStories';
import type {
  CreateProjectStoryNameRequest,
  CreateUserStoryRequest,
  UpdateProjectStoryNameRequest,
  UpdateUserStoryRequest,
} from '../../api/types';

const storiesKey = (employeeCode: string) => ['user-stories', employeeCode];

export function useUserStories(employeeCode: string | undefined) {
  return useQuery({
    queryKey: storiesKey(employeeCode ?? ''),
    queryFn: () => userStoriesApi.getForEmployee(employeeCode!),
    enabled: Boolean(employeeCode),
  });
}

export function useCreateUserStory(employeeCode: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserStoryRequest) => userStoriesApi.create(employeeCode!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storiesKey(employeeCode ?? '') }),
  });
}

export function useUpdateUserStory(employeeCode: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserStoryRequest }) =>
      userStoriesApi.update(employeeCode!, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storiesKey(employeeCode ?? '') });
      // Timesheet lines show the story's name and dates, so refresh weeks too.
      queryClient.invalidateQueries({ queryKey: ['week'] });
    },
  });
}

export function useDeleteUserStory(employeeCode: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userStoriesApi.remove(employeeCode!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storiesKey(employeeCode ?? '') }),
  });
}

/* ---- Project story names (added by managers for their projects) ---- */

const projectStoriesKey = ['project-stories'];

/** Projects the signed-in manager/admin can add story names for. */
export function useManagedProjects(enabled: boolean) {
  return useQuery({
    queryKey: [...projectStoriesKey, 'managed'],
    queryFn: () => projectStoriesApi.getManaged(),
    enabled,
  });
}

/** Story names the signed-in user can pick (from projects they are allocated to). */
export function useAvailableStoryNames() {
  return useQuery({
    queryKey: [...projectStoriesKey, 'available'],
    queryFn: () => projectStoriesApi.getAvailable(),
  });
}

export function useCreateStoryName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectStoryNameRequest) => projectStoriesApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectStoriesKey }),
  });
}

export function useUpdateStoryName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProjectStoryNameRequest }) => projectStoriesApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectStoriesKey }),
  });
}
