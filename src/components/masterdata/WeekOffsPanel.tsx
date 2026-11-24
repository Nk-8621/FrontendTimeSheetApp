import { Fragment, useRef, useState } from 'react';
import { Banner } from '../timesheet/Banner';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import { weekOffsApi } from '../../api/weekOffs';
import type { ClientWeekOffDto, EmployeeWeekOffDto } from '../../api/types';
import { useWeekOffMutations, useWeekOffOptions, useWeekOffs } from '../../hooks/api/useWeekOffs';
import { AssignEmployeesDrawer, ClientWeekOffDrawer, EmployeeWeekOffDrawer } from './WeekOffDrawer';
import controls from '../../styles/controls.module.css';
import styles from '../../pages/MasterData.module.css';

// WEEK OFFS (Nov 2026): Master Data -> Week Offs tab.
// One row per client week off with its employee count; click a row to see
// the employees. Employees are added per client, or in bulk by Excel.

/** "2026-12-01" -> "01-12-2026" */
function showDate(isoDate: string | null) {
  if (!isoDate) return 'No end date';
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

export function WeekOffsPanel() {
  const { data: clients, isLoading } = useWeekOffs();
  const { data: options } = useWeekOffOptions();
  const mutations = useWeekOffMutations();
  const { openDrawer, closeDrawer, toast, confirm } = useUI();
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function toggleRow(id: number) {
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  // Search matches the client, its days, or any employee under it.
  const searchText = search.trim().toLowerCase();
  const visible = (clients ?? []).filter((c) =>
    !searchText ||
    [c.clientName, c.weekOffDays.join(','), ...c.employees.flatMap((e) => [e.employeeName, e.employeeCode])]
      .some((v) => v.toLowerCase().includes(searchText)));

  // ---- Client week offs ----

  function handleAddOrEditClient(existing?: ClientWeekOffDto) {
    if (!options) return;
    openDrawer({
      title: existing ? 'Edit Custom Week Off' : 'Add Custom Week Off',
      body: (
        <ClientWeekOffDrawer
          existing={existing}
          options={options}
          onCancel={closeDrawer}
          onSave={(body) => {
            const request = existing
              ? mutations.updateClient.mutateAsync({ id: existing.id, body })
              : mutations.createClient.mutateAsync(body);
            request
              .then(() => { closeDrawer(); toast(existing ? 'Custom week off updated' : 'Custom week off added', 'ok'); })
              .catch((err) => showError(err, 'Could not save this week off'));
          }}
          onDelete={existing ? () => handleDeleteClient(existing) : undefined}
        />
      ),
    });
  }

  async function handleDeleteClient(client: ClientWeekOffDto) {
    const ok = await confirm({
      title: 'Delete Custom Week Off',
      message: `Delete the ${client.weekOffDays.join(', ')} week offs for ${client.clientName}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    mutations.removeClient.mutateAsync(client.id)
      .then(() => { closeDrawer(); toast('Custom week off deleted', 'ok'); })
      .catch((err) => showError(err, 'Could not delete this week off'));
  }

  // ---- Employees ----

  function handleAddEmployees(client: ClientWeekOffDto) {
    if (!options) return;
    openDrawer({
      title: 'Add Employees',
      body: (
        <AssignEmployeesDrawer
          client={client}
          options={options}
          onCancel={closeDrawer}
          onSave={(body) => {
            mutations.assignEmployees.mutateAsync(body)
              .then(() => {
                closeDrawer();
                setOpenIds((ids) => (ids.includes(client.id) ? ids : [...ids, client.id]));
                toast(`${body.employeeCodes.length} employee${body.employeeCodes.length === 1 ? '' : 's'} added to ${client.clientName}`, 'ok');
              })
              .catch((err) => showError(err, 'Could not add these employees'));
          }}
        />
      ),
    });
  }

  function handleEditEmployee(employee: EmployeeWeekOffDto, clientName: string) {
    openDrawer({
      title: 'Edit Employee Dates',
      body: (
        <EmployeeWeekOffDrawer
          existing={employee}
          clientName={clientName}
          onCancel={closeDrawer}
          onSave={(body) => {
            mutations.updateEmployee.mutateAsync({ id: employee.id, body })
              .then(() => { closeDrawer(); toast('Employee dates updated', 'ok'); })
              .catch((err) => showError(err, 'Could not update these dates'));
          }}
          onDelete={() => handleRemoveEmployee(employee, clientName)}
        />
      ),
    });
  }

  async function handleRemoveEmployee(employee: EmployeeWeekOffDto, clientName: string) {
    const ok = await confirm({
      title: 'Remove Employee',
      message: `Remove ${employee.employeeName} from ${clientName}? Their week offs go back to their primary client's default for those dates.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    mutations.removeEmployee.mutateAsync(employee.id)
      .then(() => { closeDrawer(); toast('Employee removed', 'ok'); })
      .catch((err) => showError(err, 'Could not remove this employee'));
  }

  // ---- Excel ----

  async function handleDownloadTemplate() {
    try {
      const blob = await weekOffsApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Week_Offs_Employees_Template.xlsx';
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
          toast(`${result.imported} employee${result.imported === 1 ? '' : 's'} added`, 'ok');
        }
      })
      .catch((err) => showError(err, 'Could not upload the file'))
      .finally(() => { if (fileInput.current) fileInput.current.value = ''; });
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap', minHeight: 34 }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <input
            className={controls.textInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, day, employee…"
            aria-label="Search week offs"
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={controls.btn} onClick={handleDownloadTemplate}>Download Template</button>
          <button className={controls.btn} onClick={() => fileInput.current?.click()} disabled={mutations.importFile.isPending}>
            {mutations.importFile.isPending ? 'Uploading…' : 'Upload Employees (Excel)'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={(e) => handleFilePicked(e.target.files?.[0])}
          />
          <button className={`${controls.btn} ${controls.pri}`} onClick={() => handleAddOrEditClient()} disabled={!options}>Add Custom Week Off</button>
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
                <th>Client</th><th>Week Offs</th><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Employees</th>
                <th style={{ width: 150 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ color: 'var(--slate)' }}>Loading…</td></tr>}
              {!isLoading && visible.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--slate)', textAlign: 'center', padding: 24 }}>No Record Found</td></tr>
              )}
              {visible.map((c) => {
                const isOpen = openIds.includes(c.id);
                return (
                  <Fragment key={c.id}>
                    <tr onClick={() => toggleRow(c.id)} style={{ cursor: 'pointer' }} title={isOpen ? 'Hide employees' : 'Show employees'}>
                      <td>
                        <span style={{ display: 'inline-block', width: 14, fontSize: 10, color: 'var(--slate)' }}>{isOpen ? '▼' : '▶'}</span>
                        <b>{c.clientName}</b>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.weekOffDays.join(', ')}</td>
                      <td className="num">{showDate(c.effectiveFrom)}</td>
                      <td className="num" style={{ color: c.effectiveTo ? undefined : 'var(--slate)' }}>{showDate(c.effectiveTo)}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{c.employees.length}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleAddEmployees(c)} disabled={!options}>Add Employees</button>
                        <button className={styles.editBtn} onClick={() => handleAddOrEditClient(c)} title="Edit custom week off" aria-label={`Edit week off for ${c.clientName}`} style={{ marginLeft: 6 }}>✎</button>
                      </td>
                    </tr>
                    {isOpen && c.employees.length === 0 && (
                      <tr style={{ background: '#F7F9FC' }}>
                        <td colSpan={6} style={{ paddingLeft: 36, color: 'var(--slate)' }}>No employees yet - use Add Employees.</td>
                      </tr>
                    )}
                    {isOpen && c.employees.map((e) => (
                      <tr key={`${c.id}-${e.id}`} style={{ background: '#F7F9FC' }}>
                        <td style={{ paddingLeft: 36 }}>
                          <div style={{ fontWeight: 500 }}>{e.employeeName}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{e.employeeCode}</div>
                        </td>
                        <td style={{ color: 'var(--slate)' }}>{e.createdByName ? `Added by ${e.createdByName}` : ''}</td>
                        <td className="num">{showDate(e.effectiveFrom)}</td>
                        <td className="num" style={{ color: e.effectiveTo ? undefined : 'var(--slate)' }}>{showDate(e.effectiveTo)}</td>
                        <td />
                        <td style={{ textAlign: 'right' }}>
                          <button className={styles.editBtn} onClick={() => handleEditEmployee(e, c.clientName)} title="Edit dates" aria-label={`Edit dates for ${e.employeeName}`}>✎</button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.gridFoot}>
          <span>{visible.length} custom week off{visible.length !== 1 ? 's' : ''} · Employees not listed here follow their primary client's default week off (Customers & Internal)</span>
        </div>
      </div>
    </>
  );
}
