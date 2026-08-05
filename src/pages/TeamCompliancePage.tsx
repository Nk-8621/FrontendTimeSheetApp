import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { StatusPill } from '../components/ui/StatusPill';
import { Banner } from '../components/timesheet/Banner';
import { useTeamCompliance } from '../hooks/api/useTeam';
import { useSession } from '../session/SessionContext';
import { mondayOf, addDays, toISO, weekDays } from '../lib/dates';
import queueStyles from '../components/approvals/ApprovalQueue.module.css';
import kpiStyles from '../components/timesheet/KpiStrip.module.css';
import styles from './TeamCompliance.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function cellClass(hours: number, dayType: string) {
  if (dayType === 'L') return styles.lv;
  if (dayType === 'H') return styles.hd;
  if (hours === 0) return styles.z;
  if (hours < 4) return styles.lo;
  if (hours < 8) return styles.md;
  return styles.hi;
}

export function TeamCompliancePage() {
  const { isAdmin } = useSession();
  const [weekStart, setWeekStart] = useState(() => mondayOf(toISO(new Date())));
  const { data: rows, isLoading, isError } = useTeamCompliance(weekStart);
  const today = toISO(new Date());

  const shiftWeek = (direction: -1 | 1) => setWeekStart((w) => addDays(w, direction * 7));
  const days = weekDays(weekStart);
  const zeroLogged = rows?.filter((r) => !r.hasLogged) ?? [];

  const totalHours = rows?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;
  const totalCapacity = rows?.reduce((sum, r) => sum + r.capacityHours, 0) ?? 0;
  const totalBillable = rows?.reduce((sum, r) => sum + r.billableHours, 0) ?? 0;
  const submittedCount = rows?.filter((r) => r.status !== 'Draft' && r.status !== 'Rejected' && r.status !== 'NotStarted').length ?? 0;
  const elapsedDays = days.filter((d) => d <= today).length;
  const pctOfCapacity = totalCapacity ? Math.round((totalHours / totalCapacity) * 100) : 0;
  const pctBillable = totalHours ? Math.round((totalBillable / totalHours) * 100) : 0;

  return (
    <>
      <PageHeader crumb="Oversight" title="Team Compliance">
        <WeekNav weekStart={weekStart} onShift={shiftWeek} />
      </PageHeader>
      <div className="page-content">
        <Banner>
          {isAdmin ? 'Showing every employee in the organization.' : 'Showing your direct reports.'}
        </Banner>
        {isLoading && <Banner>Loading compliance data…</Banner>}
        {isError && <Banner kind="reject">Couldn't load compliance data — check that the backend API is reachable.</Banner>}

        {rows && (
          <>
            {zeroLogged.length > 0 && (
              <Banner kind="warn">
                <b>{zeroLogged.length} team member{zeroLogged.length > 1 ? 's have' : ' has'} logged nothing this week:</b>{' '}
                {zeroLogged.map((z) => z.fullName).join(', ')}.
              </Banner>
            )}

            <div className={kpiStyles.kpis}>
              <div className={`${kpiStyles.kpi} ${kpiStyles.a}`}>
                <div className={kpiStyles.k}>Team hours logged</div>
                <div className={kpiStyles.v}>{totalHours.toFixed(0)}<small> / {totalCapacity.toFixed(0)}</small></div>
                <div className={kpiStyles.d}>{pctOfCapacity}% of capacity · {elapsedDays} of 7 days elapsed</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.g}`}>
                <div className={kpiStyles.k}>Billable share</div>
                <div className={kpiStyles.v}>{pctBillable}<small>%</small></div>
                <div className={kpiStyles.d}>{totalBillable.toFixed(0)} h billable of {totalHours.toFixed(0)} h</div>
              </div>
              <div className={`${kpiStyles.kpi} ${submittedCount === rows.length ? kpiStyles.g : kpiStyles.w}`}>
                <div className={kpiStyles.k}>Submitted</div>
                <div className={kpiStyles.v}>{submittedCount}<small> / {rows.length}</small></div>
                <div className={kpiStyles.d}>weeks sent for approval</div>
              </div>
              <div className={`${kpiStyles.kpi} ${kpiStyles.r}`}>
                <div className={kpiStyles.k}>Nothing logged</div>
                <div className={kpiStyles.v}>{zeroLogged.length}</div>
                <div className={kpiStyles.d}>of {rows.length} in scope</div>
              </div>
            </div>

            <div className={queueStyles.table} style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Resource</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Department</th>
                    {DAY_NAMES.map((d, i) => (
                      <th key={d} style={{ width: 44, textAlign: 'center', padding: '10px 4px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>
                        {d}
                        <div className="num" style={{ fontWeight: 400, fontSize: 9, color: 'var(--slate2)' }}>{Number(days[i].slice(-2))}</div>
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Logged</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Cap.</th>
                    <th style={{ width: 112, textAlign: 'left', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Billable split</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid var(--ruleStrong)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={12}><div className={queueStyles.empty}>No direct reports found.</div></td></tr>
                  ) : (
                    rows.map((r) => {
                      const pctBill = r.totalHours ? Math.round((r.billableHours / r.totalHours) * 100) : 0;
                      const initials = r.fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
                      return (
                        <tr key={r.employeeCode}>
                          <td style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 23, height: 23, borderRadius: '50%', background: 'var(--oxideTint)', color: 'var(--oxide)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--slate)' }}>{r.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)', fontSize: 11, color: 'var(--slate)' }}>{r.departmentName}</td>
                          {r.dailyHours.map((h, i) => (
                            <td key={i} style={{ padding: '4px', borderTop: '1px solid var(--rule)', textAlign: 'center' }}>
                              <div className={`${styles.hc} ${cellClass(h, r.dailyDayTypes[i])}`} title={`${DAY_NAMES[i]} — ${r.dailyDayTypes[i]}`}>
                                {r.dailyDayTypes[i] === 'L' ? 'L' : r.dailyDayTypes[i] === 'H' ? 'H' : (h ? h.toFixed(1).replace(/\.0$/, '') : '·')}
                              </div>
                            </td>
                          ))}
                          <td className="num" style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)', textAlign: 'right', fontWeight: 600, color: r.totalHours < r.capacityHours ? 'var(--amber)' : undefined }}>
                            {r.totalHours.toFixed(1) || '0'}
                          </td>
                          <td className="num" style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)', textAlign: 'right', color: 'var(--slate)' }}>{r.capacityHours.toFixed(0)}</td>
                          <td style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)' }}>
                            {r.totalHours ? (
                              <>
                                <div className={styles.bar}>
                                  <i style={{ width: `${pctBill}%`, background: 'var(--oxide)', display: 'block', height: '100%' }} />
                                  <i style={{ width: `${100 - pctBill}%`, background: 'var(--slate2, #C7CEDA)', display: 'block', height: '100%' }} />
                                </div>
                                <div className="num" style={{ fontSize: 10, color: 'var(--slate)', marginTop: 2 }}>{pctBill}% billable</div>
                              </>
                            ) : <span style={{ color: 'var(--slate2)' }}>—</span>}
                          </td>
                          <td style={{ padding: '9px 14px', borderTop: '1px solid var(--rule)' }}><StatusPill status={r.status} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className={styles.legend}>
                <span><i className={styles.sw} style={{ background: '#C3DCEC' }} /> 8 h+</span>
                <span><i className={styles.sw} style={{ background: '#DCE9F2' }} /> 4–8 h</span>
                <span><i className={styles.sw} style={{ background: '#FCF2E1' }} /> under 4 h</span>
                <span><i className={styles.sw} style={{ background: '#F1F4F8' }} /> nothing logged</span>
                <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,#FBE9E7 0 4px,#F5D9D6 4px 8px)' }} /> Leave</span>
                <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,#FCF2E1 0 4px,#F6E7CB 4px 8px)' }} /> Holiday</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}