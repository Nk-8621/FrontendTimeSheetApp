import { Fragment, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useReportsSummary } from '../hooks/api/useReports';
import { useDepartments } from '../hooks/api/useMasterData';
import { toISO } from '../lib/dates';
import { reportsApi } from '../api/reports';
import { ApiError } from '../api/httpClient';
import { useUI } from '../components/ui/UIProvider';
import type { ReportApprovalStatus, ReportRollupRowDto } from '../api/types';
import controls from '../styles/controls.module.css';
import kpiStyles from '../components/timesheet/KpiStrip.module.css';
import styles from './Reports.module.css';

// RESOURCE EXPANSION (Nov 2026): Resource-wise and Module & Task tabs removed -
// each row below can now be expanded to show the employees behind it.
type Tab = 'dept' | 'acc' | 'proj';
const TABS: [Tab, string, string][] = [
  ['dept', 'Department-wise', 'Top of the hierarchy'],
  ['acc', 'Customer / Internal', 'Second level'],
  ['proj', 'Project-wise', 'Third level'],
];

/** Labels of the Approval status drop-down - used in the download prompt and file name. */
const STATUS_LABELS: Record<ReportApprovalStatus, string> = {
  all: 'All Timesheets',
  sub: 'Submitted',
  ok: 'Approved',
};

/** "2026-11-01" -> "011126" (for the file name). */
function ddmmyy(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}${month}${year.slice(2)}`;
}

/** "2026-11-01" -> "01/11/2026" (for the prompt). */
function ddmmyyyy(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** "All Timesheets" -> "AllTimesheets" - keeps the file name free of spaces and odd characters. */
function fileSafe(text: string) {
  return text.replace(/[^A-Za-z0-9]+/g, '');
}

/** "108.0 (68%)" - hours with their share of the row's total, or a dash. */
function hoursWithPct(hours: number, total: number) {
  if (hours.toFixed(1) === '0.0') return '—';
  const pct = total ? Math.round((hours / total) * 100) : 0;
  return (
    <>
      {hours.toFixed(1)}
      <span style={{ color: 'var(--slate2)', fontSize: 11, marginLeft: 4 }}>({pct}%)</span>
    </>
  );
}

export function ReportsPage() {
  // DATE RANGE (Nov 2026): From/To dates replace the Week from / Week to
  // drop-downs. Default: 1st of this month to today. To revert this page,
  // restore it from git (the week version used weekOptions + weekLabel).
  const today = toISO(new Date());
  const [fromDate, setFromDate] = useState(() => today.slice(0, 8) + '01');
  const [toDate, setToDate] = useState(today);
  const datesInvalid = !fromDate || !toDate || toDate < fromDate;
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<ReportApprovalStatus>('all');
  const [tab, setTab] = useState<Tab>('dept');
  // Which rows are expanded (by key + sub label). Cleared when the tab changes.
  const [openRows, setOpenRows] = useState<string[]>([]);

  function toggleRow(rowId: string) {
    setOpenRows((rows) => (rows.includes(rowId) ? rows.filter((r) => r !== rowId) : [...rows, rowId]));
  }

  const departments = useDepartments();
  const { data, isError } = useReportsSummary(fromDate, toDate, departmentId || undefined, approvalStatus);

  const rowsForTab: Record<Tab, ReportRollupRowDto[]> = {
    dept: data?.departmentWise ?? [],
    acc: data?.accountWise ?? [],
    proj: data?.projectWise ?? [],
  };
  const activeRows = rowsForTab[tab];
  const activeTabMeta = TABS.find(([key]) => key === tab)!;

  // REPORTS DOWNLOAD (Nov 2026): one Excel file with all three views
  // (plus a Summary sheet), built by the backend with the current filters.
  const { toast, confirm } = useUI();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    // Tell the user exactly what they're downloading before it starts.
    const departmentName = departments.data?.find((d) => d.id === departmentId)?.name ?? 'All departments';
    const statusName = STATUS_LABELS[approvalStatus];
    const ok = await confirm({
      title: 'Download Report',
      message: `You are downloading ${departmentName}, ${statusName} (${ddmmyyyy(fromDate)} to ${ddmmyyyy(toDate)}).`,
      confirmLabel: 'OK',
    });
    if (!ok) return;

    setIsDownloading(true);
    try {
      const blob = await reportsApi.downloadSummaryExcel(fromDate, toDate, departmentId || undefined, approvalStatus);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Report_<Department>_<ApprovalStatus>_<fromDate DDMMYY>_<toDate DDMMYY>.xlsx
      link.download = `Report_${fileSafe(departmentName)}_${fileSafe(statusName)}_${ddmmyy(fromDate)}_${ddmmyy(toDate)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not download the report', 'bad');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <PageHeader title="Reports" />
      <div className="page-content">
        <div className={styles.filters}>
          <div className={styles.f}>
            <label>Department</label>
            <select className={controls.select} value={departmentId} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All departments</option>
              {departments.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className={styles.f}>
            <label htmlFor="repFrom">From date</label>
            <input id="repFrom" type="date" className={controls.textInput} value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className={styles.f}>
            <label htmlFor="repTo">To date</label>
            <input id="repTo" type="date" className={controls.textInput} value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className={styles.f}>
            <label>Approval status</label>
            <select className={controls.select} value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as ReportApprovalStatus)}>
              <option value="all">All Timesheets</option>
              <option value="sub">Submitted</option>
              <option value="ok">Approved</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button className={controls.btn} onClick={handleDownload} disabled={datesInvalid || !data || data.actualHours === 0 || isDownloading}>
            {isDownloading ? 'Downloading…' : 'Download Report'}
          </button>
        </div>

        {datesInvalid && <Banner kind="warn">The To date can't be before the From date.</Banner>}
        {isError && <Banner kind="reject">Couldn't load the report — check that the backend API is reachable.</Banner>}

        {data && (
          <>
            <div className={kpiStyles.kpis}>
              <div className={`${kpiStyles.kpi} ${kpiStyles.a}`}>
                <div className={kpiStyles.k}>Actual hours</div>
                <div className={kpiStyles.v}>{data.actualHours.toFixed(0)}<small> h</small></div>
                <div className={kpiStyles.d}>{data.taskLineCount} task lines</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.g}`}>
                <div className={kpiStyles.k}>Billable</div>
                <div className={kpiStyles.v}>{data.billableHours.toFixed(0)}<small> h</small></div>
                <div className={kpiStyles.d}>{data.actualHours ? Math.round((data.billableHours / data.actualHours) * 100) : 0}% of actual</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.p}`}>
                <div className={kpiStyles.k}>Partial billable</div>
                <div className={kpiStyles.v}>{data.totalPartialBillableHours.toFixed(0)}<small> h</small></div>
                <div className={kpiStyles.d}>{data.actualHours ? Math.round((data.totalPartialBillableHours / data.actualHours) * 100) : 0}% of actual</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.w}`}>
                <div className={kpiStyles.k}>Non-billable</div>
                <div className={kpiStyles.v}>{data.nonBillableHours.toFixed(0)}<small> h</small></div>
                <div className={kpiStyles.d}>{data.actualHours ? Math.round((data.nonBillableHours / data.actualHours) * 100) : 0}% of actual</div>
              </div>
              <div className={kpiStyles.kpi}>
                <div className={kpiStyles.k}>Resources reporting</div>
                <div className={kpiStyles.v}>{data.resourcesReporting}</div>
                <div className={kpiStyles.d}>across {data.projectsInScope} projects</div>
              </div>
            </div>

            <div className={styles.tabs}>
              {TABS.map(([key, label]) => (
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => { setTab(key); setOpenRows([]); }}>{label}</button>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHd}>
                <h3 style={{ display: 'inline' }}>{activeTabMeta[1]} actual hours</h3>
              </div>
              {activeRows.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate)' }}>No hours match the current filters.</div>
              ) : (
                <table className={styles.plainTable}>
                  <thead>
                    <tr>
                      <th>{activeTabMeta[1].replace(/-wise.*/, '')}</th>
                      <th style={{ textAlign: 'right' }}>Total h</th>
                      <th style={{ textAlign: 'right' }}>Billable</th>
                      <th style={{ textAlign: 'right' }}>Partial</th>
                      <th style={{ textAlign: 'right' }}>Non-bill</th>
                      <th style={{ textAlign: 'right' }}>Resources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((r) => {
                      const rowId = r.key + r.subLabel;
                      const isOpen = openRows.includes(rowId);
                      const canOpen = (r.resources?.length ?? 0) > 0;
                      return (
                        <Fragment key={rowId}>
                          <tr
                            onClick={() => canOpen && toggleRow(rowId)}
                            style={{ cursor: canOpen ? 'pointer' : undefined }}
                            title={canOpen ? (isOpen ? 'Hide employees' : 'Show employees') : undefined}
                          >
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ width: 12, fontSize: 10, color: 'var(--slate)', paddingTop: 2 }}>{canOpen ? (isOpen ? '▼' : '▶') : ''}</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{r.key}</div>
                                  {r.subLabel && <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{r.subLabel}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{r.totalHours.toFixed(1)}</td>
                            <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(r.billableHours, r.totalHours)}</td>
                            <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(r.partialBillableHours, r.totalHours)}</td>
                            <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(r.nonBillableHours, r.totalHours)}</td>
                            <td className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--oxide)' }}>{r.resourceCount}</td>
                          </tr>
                          {isOpen && r.resources?.map((e) => (
                            <tr key={rowId + e.key + e.subLabel} style={{ background: '#F7F9FC' }}>
                              <td style={{ paddingLeft: 46 }}>
                                <div style={{ fontWeight: 500 }}>{e.key}</div>
                                {e.subLabel && <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{e.subLabel}</div>}
                              </td>
                              <td className="num" style={{ textAlign: 'right' }}>{e.totalHours.toFixed(1)}</td>
                              <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(e.billableHours, e.totalHours)}</td>
                              <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(e.partialBillableHours, e.totalHours)}</td>
                              <td className="num" style={{ textAlign: 'right' }}>{hoursWithPct(e.nonBillableHours, e.totalHours)}</td>
                              <td />
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </>
        )}
      </div>
    </>
  );
}
