import { http, ApiError } from './httpClient';
import { getAuthHeaders } from './authBridge';
import type {
  EmployeeWeekOffDto, SaveEmployeeWeekOffRequest, WeekOffImportResultDto, WeekOffOptionsDto,
} from './types';

// WEEK OFFS (Nov 2026): Master Data -> Week Offs (Admin and HR only).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const weekOffsApi = {
  getAll: () => http.get<EmployeeWeekOffDto[]>('/api/week-offs'),
  getOptions: () => http.get<WeekOffOptionsDto>('/api/week-offs/options'),
  create: (body: SaveEmployeeWeekOffRequest) => http.post<EmployeeWeekOffDto>('/api/week-offs', body),
  update: (id: number, body: SaveEmployeeWeekOffRequest) => http.put<EmployeeWeekOffDto>(`/api/week-offs/${id}`, body),
  remove: (id: number) => http.delete<void>(`/api/week-offs/${id}`),

  /** The blank Excel template, as a Blob for the browser to save. */
  async downloadTemplate(): Promise<Blob> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/week-offs/template`, { method: 'GET', headers: { ...authHeaders } });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, errorBody?.title ?? 'Could not download the template.');
    }
    return response.blob();
  },

  /** Bulk upload. Uses fetch directly - a file needs a multipart body. */
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
