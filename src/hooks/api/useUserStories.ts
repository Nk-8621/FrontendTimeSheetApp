import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userStoriesApi } from '../../api/userStories';
import type { CreateUserStoryRequest } from '../../api/types';

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
