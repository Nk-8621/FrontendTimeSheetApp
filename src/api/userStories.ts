import { http } from './httpClient';
import type { CreateUserStoryRequest, UpdateUserStoryRequest, UserStoryDto } from './types';

export const userStoriesApi = {
  getForEmployee: (employeeCode: string) => http.get<UserStoryDto[]>(`/api/user-stories/${employeeCode}`),

  create: (employeeCode: string, body: CreateUserStoryRequest) =>
    http.post<UserStoryDto>(`/api/user-stories/${employeeCode}`, body),

  update: (employeeCode: string, userStoryId: number, body: UpdateUserStoryRequest) =>
    http.put<UserStoryDto>(`/api/user-stories/${employeeCode}/${userStoryId}`, body),

  // Only works for a story with no tasks in any week.
  remove: (employeeCode: string, userStoryId: number) =>
    http.delete<void>(`/api/user-stories/${employeeCode}/${userStoryId}`),
};
