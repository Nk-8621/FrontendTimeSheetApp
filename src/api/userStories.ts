import { http } from './httpClient';
import type {
  CreateProjectStoryNameRequest,
  CreateUserStoryRequest,
  ManagedProjectDto,
  ProjectStoryNameDto,
  UpdateProjectStoryNameRequest,
  UpdateUserStoryRequest,
  UserStoryDto,
} from './types';

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

/** Story names managers add for their projects (signed-in user decides access). */
export const projectStoriesApi = {
  // Projects the signed-in manager/admin can add names for, with their names.
  getManaged: () => http.get<ManagedProjectDto[]>('/api/project-stories/managed'),

  // Active names on the projects the signed-in user is allocated to.
  getAvailable: () => http.get<ProjectStoryNameDto[]>('/api/project-stories/available'),

  create: (body: CreateProjectStoryNameRequest) => http.post<ProjectStoryNameDto>('/api/project-stories', body),

  update: (id: number, body: UpdateProjectStoryNameRequest) =>
    http.put<ProjectStoryNameDto>(`/api/project-stories/${id}`, body),
};
