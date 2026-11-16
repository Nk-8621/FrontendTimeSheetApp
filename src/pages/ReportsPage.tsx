import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useReportsSummary } from '../hooks/api/useReports';
import { useDepartments } from '../hooks/api/useMasterData';
import { toISO } from '../lib/dates';
import { downloadCsv } from '../lib/csv';
import type { ReportApprovalStatus, ReportRollupRowDto } from '../api/types';
import controls from '../styles/controls.module.css';
import kpiStyles from '../components/timesheet/KpiStrip.module.css';
import styles from './Reports.module.css';

type Tab = 'dept' | 'acc' | 'proj' | 'res' | 'task';
const TABS: [Tab, string, string][] = [
  ['dept', 'Department-wise', 'Top of the hierarchy'],
  ['acc', 'Customer / Internal', 'Second level'],
  ['proj', 'Project-wise', 'Third level'],
  ['res', 'Resource-wise', 'Who spent the time'],
  ['task', 'Module & Task', 'Lowest level of the hierarchy'],
];

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

  const departments = useDepartments();
  const { data, isError } = useReportsSummary(fromDate, toDate, departmentId || undefined, approvalStatus);

  const rowsForTab: Record<Tab, ReportRollupRowDto[]> = {
    dept: data?.departmentWise ?? [],
    acc: data?.accountWise ?? [],
    proj: data?.projectWise ?? [],
    res: data?.resourceWise ?? [],
    task: data?.taskWise ?? [],
  };
  const activeRows = rowsForTab[tab];
  const maxTotal = activeRows.length ? activeRows[0].totalHours : 0;
  const activeTabMeta = TABS.find(([key]) => key === tab)!;

  function handleExport() {
    if (!activeRows.length) return;
    downloadCsv(
      `report-${activeTabMeta[1].toLowerCase().replace(/[^a-z]+/g, '-')}-${fromDate}-to-${toDate}.csv`,
      ['Name', 'Detail', 'Total Hours', 'Billable', 'Partial billable', 'Non-billable', 'Bill %', 'Resources'],
      activeRows.map((r) => [
        r.key, r.subLabel, r.totalHours, r.billableHours, r.partialBillableHours, r.nonBillableHours,
        r.totalHours ? Math.round((r.billableHours / r.totalHours) * 100) : 0, r.resourceCount,
      ]),
    );
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
          <button className={controls.btn} onClick={handleExport} disabled={!activeRows.length}>Export CSV</button>
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
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
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
                      <th>{activeTabMeta[1].replace(/-wise.*/, '').replace(' / Task', '').replace('Module & ', '')}</th>
                      <th style={{ textAlign: 'right' }}>Total h</th>
                      <th style={{ textAlign: 'right' }}>Billable</th>
                      <th style={{ textAlign: 'right' }}>Partial</th>
                      <th style={{ textAlign: 'right' }}>Non-bill</th>
                      <th style={{ textAlign: 'right' }}>Bill %</th>
                      <th>Share</th>
                      <th style={{ textAlign: 'right' }}>Resources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((r) => {
                      const billPct = r.totalHours ? Math.round((r.billableHours / r.totalHours) * 100) : 0;
                      const shareWidth = maxTotal ? Math.max(6, (r.totalHours / maxTotal) * 100) : 0;
                      return (
                        <tr key={r.key + r.subLabel}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.key}</div>
                            {r.subLabel && <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{r.subLabel}</div>}
                          </td>
                          <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{r.totalHours.toFixed(1)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r.billableHours.toFixed(1) === '0.0' ? '—' : r.billableHours.toFixed(1)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r.partialBillableHours.toFixed(1) === '0.0' ? '—' : r.partialBillableHours.toFixed(1)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r.nonBillableHours.toFixed(1) === '0.0' ? '—' : r.nonBillableHours.toFixed(1)}</td>
                          <td className="num" style={{ textAlign: 'right', fontWeight: 600, color: billPct >= 70 ? 'var(--verd)' : billPct < 40 ? 'var(--amber)' : 'var(--ink2)' }}>
                            {billPct}%
                          </td>
                          <td style={{ width: 170 }}>
                            <div className={styles.shareBar} style={{ width: `${shareWidth}%` }}>
                              <i style={{ width: `${r.totalHours ? (r.billableHours / r.totalHours) * 100 : 0}%`, background: 'var(--oxide)' }} />
                              <i style={{ width: `${r.totalHours ? (r.partialBillableHours / r.totalHours) * 100 : 0}%`, background: 'var(--violet)' }} />
                              <i style={{ width: `${r.totalHours ? (r.nonBillableHours / r.totalHours) * 100 : 0}%`, background: 'var(--slate2, #C7CEDA)' }} />
                            </div>
                          </td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--slate)' }}>{r.resourceCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.legend}>
              <span><i className={styles.sw} style={{ background: 'var(--oxide)' }} /> Billable</span>
              <span><i className={styles.sw} style={{ background: 'var(--violet)' }} /> Partial billable</span>
              <span><i className={styles.sw} style={{ background: 'var(--slate2, #C7CEDA)' }} /> Non-billable</span>
              <span style={{ color: 'var(--slate2)' }}>Billing rates are maintained outside Meridian — this reports hours only.</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
