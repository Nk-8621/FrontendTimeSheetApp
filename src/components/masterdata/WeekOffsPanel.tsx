import { useRef, useState } from 'react';
import { Banner } from '../timesheet/Banner';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import { weekOffsApi } from '../../api/weekOffs';
import type { EmployeeWeekOffDto } from '../../api/types';
import { useWeekOffMutations, useWeekOffOptions, useWeekOffs } from '../../hooks/api/useWeekOffs';
import { WeekOffDrawer } from './WeekOffDrawer';
import controls from '../../styles/controls.module.css';
import styles from '../../pages/MasterData.module.css';

// WEEK OFFS (Nov 2026): Master Data -> Week Offs tab. Employee-specific week
// offs for people working for a client - added one at a time or by Excel.

/** "2026-12-01" -> "01-12-2026" */
function showDate(isoDate: string | null) {
  if (!isoDate) return 'No end date';
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

export function WeekOffsPanel() {
  const { data: records, isLoading } = useWeekOffs();
  const { data: options } = useWeekOffOptions();
  const mutations = useWeekOffMutations();
  const { openDrawer, closeDrawer, toast, confirm } = useUI();
  const [search, setSearch] = useState('');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  const searchText = search.trim().toLowerCase();
  const visible = (records ?? []).filter((r) =>
    !searchText ||
    [r.employeeName, r.employeeCode, r.clientName, r.weekOffDays.join(',')]
      .some((v) => v.toLowerCase().includes(searchText)));

  function handleAddOrEdit(existing?: EmployeeWeekOffDto) {
    if (!options) return;
    openDrawer({
      title: existing ? 'Edit Week Off' : 'Add Week Off',
      body: (
        <WeekOffDrawer
          existing={existing}
          options={options}
          onCancel={closeDrawer}
          onSave={(body) => {
            const request = existing
              ? mutations.update.mutateAsync({ id: existing.id, body })
              : mutations.create.mutateAsync(body);
            request
              .then(() => { closeDrawer(); toast(existing ? 'Week off updated' : 'Week off added', 'ok'); })
              .catch((err) => showError(err, 'Could not save this week off'));
          }}
          onDelete={existing ? () => handleDelete(existing) : undefined}
        />
      ),
    });
  }

  async function handleDelete(record: EmployeeWeekOffDto) {
    const ok = await confirm({
      title: 'Delete Week Off',
      message: `Delete the week offs for ${record.employeeName} (${record.clientName})? Their week offs go back to the company default (Sat, Sun) for those dates.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    mutations.remove.mutateAsync(record.id)
      .then(() => { closeDrawer(); toast('Week off deleted', 'ok'); })
      .catch((err) => showError(err, 'Could not delete this week off'));
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await weekOffsApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Week_Offs_Template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(err, 'Could not download the template');
    }
  }

  function handleFilePicked(file: File | undefined) {
    if (!file) return;
    setUploadErrors([]);
    mutations.importFile.mutateAsync(file)
      .then((result) => {
        if (result.errors.length > 0) {
          setUploadErrors(result.errors);
          toast('Nothing was saved - please fix the rows listed', 'bad');
        } else {
          toast(`${result.imported} week off record${result.imported === 1 ? '' : 's'} added`, 'ok');
        }
      })
      .catch((err) => showError(err, 'Could not upload the file'))
      .finally(() => { if (fileInput.current) fileInput.current.value = ''; });
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <input
            className={controls.textInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, code, client, day…"
            aria-label="Search week offs"
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={controls.btn} onClick={handleDownloadTemplate}>Download Template</button>
          <button className={controls.btn} onClick={() => fileInput.current?.click()} disabled={mutations.importFile.isPending}>
            {mutations.importFile.isPending ? 'Uploading…' : 'Upload Excel'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={(e) => handleFilePicked(e.target.files?.[0])}
          />
          <button className={`${controls.btn} ${controls.pri}`} onClick={() => handleAddOrEdit()} disabled={!options}>Add Week Off</button>
        </div>
      </div>

      {uploadErrors.length > 0 && (
        <Banner kind="reject">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <b>Nothing was saved. Fix these rows and upload the file again:</b>
            <button className={styles.editBtn} onClick={() => setUploadErrors([])} aria-label="Close">✕</button>
          </div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {uploadErrors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Banner>
      )}

      <div className={styles.card}>
        <div className={styles.tableScroll}>
          <table className={styles.plainTable}>
            <thead>
              <tr>
                <th>Employee</th><th>Client</th><th>Week Offs</th><th>From</th><th>To</th><th>Added By</th>
                <th className={styles.editCol} />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ color: 'var(--slate)' }}>Loading…</td></tr>}
              {!isLoading && visible.length === 0 && (
                <tr><td colSpan={7} style={{ color: 'var(--slate)', textAlign: 'center', padding: 24 }}>No Record Found</td></tr>
              )}
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.employeeName}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{r.employeeCode}</div>
                  </td>
                  <td>{r.clientName}</td>
                  <td style={{ fontWeight: 600 }}>{r.weekOffDays.join(', ')}</td>
                  <td className="num">{showDate(r.effectiveFrom)}</td>
                  <td className="num" style={{ color: r.effectiveTo ? undefined : 'var(--slate)' }}>{showDate(r.effectiveTo)}</td>
                  <td style={{ color: 'var(--slate)' }}>{r.createdByName ?? '—'}</td>
                  <td className={styles.editCol}>
                    <button className={styles.editBtn} onClick={() => handleAddOrEdit(r)} title="Edit week off" aria-label={`Edit week off for ${r.employeeName}`}>✎</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.gridFoot}>
          <span>{visible.length} record{visible.length !== 1 ? 's' : ''} · Employees without a record follow the company default (Sat, Sun)</span>
        </div>
      </div>
    </>
  );
}
