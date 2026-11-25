import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userStoriesApi } from '../../api/userStories';
import type { CreateUserStoryRequest, UpdateUserStoryRequest } from '../../api/types';

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
