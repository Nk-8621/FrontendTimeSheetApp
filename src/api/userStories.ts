import { http } from './httpClient';
import type { CreateUserStoryRequest, UpdateUserStoryRequest, UserStoryDto } from './types';

export const userStoriesApi = {
  getForEmployee: (employeeCode: string) => http.get<UserStoryDto[]>(`/api/user-stories/${employeeCode}`),

  create: (employeeCode: string, body: CreateUserStoryRequest) =>
    http.post<UserStoryDto>(`/api/user-stories/${employeeCode}`, body),

  update: (employeeCode: string, userStoryId: number, body: UpdateUserStoryRequest) =>
    http.put<UserStoryDto>(`/api/user-stories/${employeeCode}/${userStoryId}`, body),
};
