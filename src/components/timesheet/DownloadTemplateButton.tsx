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
    <button className={`${controls.btn} ${controls.sm}`} disabled={isDownloading} onClick={handleClick}>
      {isDownloading ? 'Downloading...' : 'Download Template'}
    </button>
  );
}
