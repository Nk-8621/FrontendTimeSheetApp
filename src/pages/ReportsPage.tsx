import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { useReportsSummary } from '../hooks/api/useReports';
import { useDepartments } from '../hooks/api/useMasterData';
import { mondayOf, addDays, toISO, weekLabel } from '../lib/dates';
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

function weekOptions(count: number, endingAt: string) {
  const options: string[] = [];
  let w = endingAt;
  for (let i = 0; i < count; i++) {
    options.unshift(w);
    w = addDays(w, -7);
  }
  return options;
}

export function ReportsPage() {
  const currentWeek = mondayOf(toISO(new Date()));
  const [weekFrom, setWeekFrom] = useState(() => addDays(currentWeek, -21));
  const [weekTo, setWeekTo] = useState(currentWeek);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<ReportApprovalStatus>('all');
  const [tab, setTab] = useState<Tab>('dept');

  const departments = useDepartments();
  const { data, isLoading, isError } = useReportsSummary(weekFrom, weekTo, departmentId || undefined, approvalStatus);

  const fromOptions = useMemo(() => weekOptions(10, currentWeek), [currentWeek]);
  const toOptions = fromOptions;

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
      `report-${activeTabMeta[1].toLowerCase().replace(/[^a-z]+/g, '-')}-${weekFrom}-to-${weekTo}.csv`,
      ['Name', 'Detail', 'Total Hours', 'Billable', 'Non-billable', 'Bill %', 'Resources'],
      activeRows.map((r) => [
        r.key, r.subLabel, r.totalHours, r.billableHours, r.nonBillableHours,
        r.totalHours ? Math.round((r.billableHours / r.totalHours) * 100) : 0, r.resourceCount,
      ]),
    );
  }

  return (
    <>
      <PageHeader crumb="Oversight" title="Reports" />
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
            <label>Week from</label>
            <select className={controls.select} value={weekFrom} onChange={(e) => setWeekFrom(e.target.value)}>
              {fromOptions.map((w) => <option key={w} value={w}>{weekLabel(w)}</option>)}
            </select>
          </div>
          <div className={styles.f}>
            <label>Week to</label>
            <select className={controls.select} value={weekTo} onChange={(e) => setWeekTo(e.target.value)}>
              {toOptions.map((w) => <option key={w} value={w}>{weekLabel(w)}</option>)}
            </select>
          </div>
          <div className={styles.f}>
            <label>Approval status</label>
            <select className={controls.select} value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as ReportApprovalStatus)}>
              <option value="all">All timesheets</option>
              <option value="sub">Submitted or beyond</option>
              <option value="ok">Fully approved only</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button className={controls.btn} onClick={handleExport} disabled={!activeRows.length}>Export CSV</button>
        </div>

        {isLoading && <Banner>Loading report…</Banner>}
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
                <span className={styles.sub}>{activeTabMeta[2]}</span>
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
                          <td className="num" style={{ textAlign: 'right' }}>{r.nonBillableHours.toFixed(1) === '0.0' ? '—' : r.nonBillableHours.toFixed(1)}</td>
                          <td className="num" style={{ textAlign: 'right', fontWeight: 600, color: billPct >= 70 ? 'var(--verd)' : billPct < 40 ? 'var(--amber)' : 'var(--ink2)' }}>
                            {billPct}%
                          </td>
                          <td style={{ width: 170 }}>
                            <div className={styles.shareBar} style={{ width: `${shareWidth}%` }}>
                              <i style={{ width: `${r.totalHours ? (r.billableHours / r.totalHours) * 100 : 0}%`, background: 'var(--oxide)' }} />
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
              <span><i className={styles.sw} style={{ background: 'var(--slate2, #C7CEDA)' }} /> Non-billable</span>
              <span style={{ color: 'var(--slate2)' }}>Billing rates are maintained outside Meridian — this reports hours only.</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}