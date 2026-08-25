import { getAuthHeaders } from './authBridge';
import { ApiError } from './httpClient';
import type { ExcelImportResult } from './timesheetImportTypes';

// ASSUMPTION — adjust this to match wherever httpClient.ts gets its own base
// URL from (an env var, a constant, etc.) so this hits the same backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5160';

export const timesheetImportApi = {
  /** Deliberately bypasses the shared `http` JSON helper — file uploads need
   * a multipart/form-data body, and the browser sets the correct boundary
   * header automatically as long as we don't set Content-Type ourselves. */
  async importWeek(employeeCode: string, weekStart: string, file: File): Promise<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/timesheet-import/${employeeCode}/${weekStart}`, {
      method: 'POST',
      headers: { ...authHeaders }, // no Content-Type here — see comment above
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, errorBody?.title ?? 'Could not import the Excel file.');
    }

    return response.json();
  },
};