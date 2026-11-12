import { useRef, type ChangeEvent } from 'react';
import { useImportTimesheetExcel } from '../../hooks/api/useTimesheetImport';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import controls from '../../styles/controls.module.css';

interface ImportExcelButtonProps {
  employeeCode: string;
  weekStart: string;
}

export function ImportExcelButton({ employeeCode, weekStart }: ImportExcelButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, openDrawer, closeDrawer } = useUI();
  const importMutation = useImportTimesheetExcel(employeeCode, weekStart);

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
    toast('Please select a valid .xlsx Excel file.', 'bad');
    return;
  }


    importMutation.mutate(file, {
      onSuccess: (result) => {
        if (result.errors.length === 0) {
          toast(
            result.linesImported > 0
              ? `${result.linesImported} line${result.linesImported > 1 ? 's' : ''} imported`
              : 'No rows found to import — check the file matches the template',
            result.linesImported > 0 ? 'ok' : 'bad',
          );
          return;
        }

        openDrawer({
          title: 'Import results',
          body: (
            <div>
              {result.linesImported > 0 && (
                <p>
                  <b>{result.linesImported}</b> line{result.linesImported > 1 ? 's' : ''} imported successfully.
                </p>
              )}
              <p><b>{result.errors.length}</b> row{result.errors.length > 1 ? 's' : ''} skipped:</p>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <button className={controls.btn} onClick={closeDrawer}>Close</button>
            </div>
          ),
        });
      },
      onError: (err) => {
        toast(err instanceof ApiError ? err.message : 'Could not import the file', 'bad');
      },
    });
  }

  return (
    <span>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelected}
        hidden
      />
      <button
        type="button"
        className={controls.lnk}
        disabled={importMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {importMutation.isPending ? 'Importing...' : 'Import Excel'}
      </button>
    </span>
  );
}
