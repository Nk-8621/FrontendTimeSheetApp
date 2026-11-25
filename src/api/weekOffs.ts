import { http, ApiError } from './httpClient';
import { getAuthHeaders } from './authBridge';
import type {
  AssignEmployeesRequest, ClientWeekOffDto, SaveClientWeekOffRequest, UpdateEmployeeWeekOffRequest,
  WeekOffImportResultDto, WeekOffOptionsDto,
} from './types';

// WEEK OFFS (Nov 2026): Master Data -> Week Offs (Admin only).
// Client week offs first, then employees assigned to the client.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const weekOffsApi = {
  getAll: () => http.get<ClientWeekOffDto[]>('/api/week-offs'),
  getOptions: () => http.get<WeekOffOptionsDto>('/api/week-offs/options'),

  createClient: (body: SaveClientWeekOffRequest) => http.post<void>('/api/week-offs/clients', body),
  updateClient: (id: number, body: SaveClientWeekOffRequest) => http.put<void>(`/api/week-offs/clients/${id}`, body),
  removeClient: (id: number) => http.delete<void>(`/api/week-offs/clients/${id}`),

  assignEmployees: (body: AssignEmployeesRequest) => http.post<void>('/api/week-offs/employees', body),
  updateEmployee: (id: number, body: UpdateEmployeeWeekOffRequest) => http.put<void>(`/api/week-offs/employees/${id}`, body),
  removeEmployee: (id: number) => http.delete<void>(`/api/week-offs/employees/${id}`),

  /** The blank Excel template (employee assignments), as a Blob. */
  async downloadTemplate(): Promise<Blob> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/week-offs/template`, { method: 'GET', headers: { ...authHeaders } });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, errorBody?.title ?? 'Could not download the template.');
    }
    return response.blob();
  },

  /** Bulk employee assignment. Uses fetch directly - a file needs a multipart body. */
  async importFile(file: File): Promise<WeekOffImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/week-offs/import`, {
      method: 'POST',
      headers: { ...authHeaders }, // no Content-Type - the browser sets it for FormData
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, errorBody?.title ?? 'Could not upload the file.');
    }
    return response.json();
  },
};
