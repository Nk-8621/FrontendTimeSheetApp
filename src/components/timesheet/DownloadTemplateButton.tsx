import { useState } from 'react';
import { timesheetImportApi } from '../../api/timesheetImport';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import controls from '../../styles/controls.module.css';

/** Downloads the blank .xlsx template — the file ImportExcelButton then
 * expects back, filled in — as a real file save, not a new tab. */
export function DownloadTemplateButton() {
  const { toast } = useUI();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleClick() {
    setIsDownloading(true);
    try {
      const blob = await timesheetImportApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Meridian_Timesheet_Import_Template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not download the template', 'bad');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" className={controls.lnk} disabled={isDownloading} onClick={handleClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isDownloading ? 'Downloading...' : 'Download template'}
    </button>
  );
}
