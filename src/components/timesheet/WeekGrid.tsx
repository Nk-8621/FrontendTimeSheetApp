import { Fragment } from 'react';
import type { TimeEntryDto, DayTypeDto } from '../../api/types';
import { DAY_NAMES, DAY_TYPE_LABELS } from '../../types/meridian';
import { useMasterDataLookup } from '../../hooks/api/useMasterDataLookup';
import { ImportExcelButton } from './ImportExcelButton';
import { DownloadTemplateButton } from './DownloadTemplateButton';
import controls from '../../styles/controls.module.css';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  employeeCode: string;
  weekStart: string;
  rows: TimeEntryDto[];
  dayTypes: DayTypeDto[];
  editable: boolean;
  status: string; // WeekStatusDto
  onHourChange: (entryId: number, dayIndex: number, value: number) => void;
  onToggleBillable: (entry: TimeEntryDto) => void;
  onCycleDayType: (date: string) => void;
  onEditLine: (entryId: number) => void;
  onAddLine: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  onRecall: () => void;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + (b || 0), 0);
const fmtH = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '—');
const today = () => new Date().toISOString().slice(0, 10);

export function WeekGrid({
  employeeCode,
  weekStart,
  rows,
  dayTypes,
  editable,
  status,
  onHourChange,
  onToggleBillable,
  onCycleDayType,
  onEditLine,
  onAddLine,
  onSubmit,
  canSubmit,
  onRecall,
}: WeekGridProps) {
  const { deptName, accById, projById, projAccountId, projDeptId, modName, taskName } = useMasterDataLookup();

  const days = dayTypes.map((d) => d.date);
  const cap = dayTypes.map((d) => d.capacityHours);
  const capTotal = sum(cap);
  const dayTotals = days.map((_, i) => sum(rows.map((r) => r.hoursByDay[i] || 0)));
  const grandTotal = sum(dayTotals);
  const todayIso = today();

  const groups: Record<number, TimeEntryDto[]> = {};
  rows.forEach((r) => {
    (groups[r.projectId] = groups[r.projectId] ?? []).push(r);
  });

  return (
    <div className={styles.gridWrap}>
      <div className={styles.cardHd}>
        <h3>Week grid</h3>
        <span className={styles.sub}>Department › Customer/Internal › Project › Module › Task</span>
        <div style={{ flex: 1 }} />
        {editable && (
          <>
            <ImportExcelButton employeeCode={employeeCode} weekStart={weekStart} />
            <DownloadTemplateButton />
            <button className={`${controls.btn} ${controls.pri} ${controls.sm}`} onClick={onAddLine}>+ Add task line</button>
          </>
        )}
      </div>
      <div className={styles.gridScroll}>
        <table className={styles.wk}>
          <thead>
            <tr>
              <th className={styles.hier}>Module › Task</th>
              <th className={styles.bcol}>Type</th>
              {days.map((d, i) => {
                const t = dayTypes[i].dayType;
                const pct = cap[i] ? Math.min(100, (dayTotals[i] / cap[i]) * 100) : dayTotals[i] ? 100 : 0;
                const capClass = cap[i] && dayTotals[i] > cap[i] ? styles.over : cap[i] && dayTotals[i] >= cap[i] ? styles.full : '';
                const dow = new Date(d).getUTCDay();
                return (
                  <th
                    key={d}
                    className={`${styles.dayHd} ${styles.dcol} ${dow === 0 || dow === 6 ? styles.wknd : ''} ${d === todayIso ? styles.today : ''}`}
                  >
                    <div className={styles.inner}>
                      <div className={styles.dn}>{DAY_NAMES[i]}</div>
                      <div className={styles.dd}>{new Date(d).getUTCDate()}</div>
                    </div>
                    <button
                      className={`${styles.dtBtn} ${styles[DAY_TYPE_LABELS[t].css] ?? ''}`}
                      disabled={!editable}
                      title={editable ? 'Click to change day type' : 'Locked'}
                      onClick={() => onCycleDayType(d)}
                    >
                      {DAY_TYPE_LABELS[t].label}
                    </button>
                    <div className={`${styles.capBar} ${capClass}`}>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </th>
                );
              })}
              <th className={styles.tcol} style={{ textAlign: 'center' }}>Total</th>
              <th className={styles.acol} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11}>
                  <div className={styles.empty}>
                    <div className={styles.big}>No hours logged for this week</div>
                    Add your first task line, or download the template and import a filled-in Excel sheet to get started.
                  </div>
                </td>
              </tr>
            )}
            {Object.keys(groups).map((pidStr) => {
              const pid = Number(pidStr);
              const accountId = projAccountId(pid);
              const acc = accountId !== undefined ? accById(accountId) : undefined;
              const deptId = projDeptId(pid);
              const proj = projById(pid);
              return (
                <Fragment key={pid}>
                  <tr className={styles.subRow}>
                    <td colSpan={11}>
                      {deptId !== undefined ? deptName(deptId) : '—'} &nbsp;›&nbsp; {acc?.name} <span style={{ opacity: 0.55 }}>({acc?.accountType})</span> &nbsp;›&nbsp; {proj?.name}{' '}
                      <span style={{ fontFamily: 'var(--mono)', opacity: 0.6 }}>[{proj?.code}]</span>
                    </td>
                  </tr>
                  {groups[pid].map((r) => (
                    <tr key={r.id}>
                      <td className={styles.hier}>
                        <div className={styles.hcell}>
                          <div className={styles.hpath}><b>{modName(r.moduleId)}</b></div>
                          <div className={styles.htask}>{taskName(r.taskId)}</div>
                          {r.note && <div className={styles.hnote}>{r.note}</div>}
                        </div>
                      </td>
                      <td className={styles.tc}>
                        {editable ? (
                          <button className={`${styles.bt} ${r.isBillable ? styles.b : styles.n}`} onClick={() => onToggleBillable(r)} title="Click to switch">
                            {r.isBillable ? 'Billable' : 'Non-bill'}
                          </button>
                        ) : (
                          <span className={`${styles.bt} ${r.isBillable ? styles.b : styles.n}`}>{r.isBillable ? 'Billable' : 'Non-bill'}</span>
                        )}
                      </td>
                      {days.map((_, i) => {
                        const t = dayTypes[i].dayType;
                        const blocked = t === 'L' || t === 'H';
                        const cls = [
                          styles.hr,
                          blocked ? (t === 'L' ? styles.blocked : styles.blockedH) : '',
                          t === 'O' ? styles.wknd : '',
                          !editable ? styles.locked : '',
                        ].join(' ');
                        return (
                          <td key={i} className={cls}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fmtH(r.hoursByDay[i]) === '—' ? '' : fmtH(r.hoursByDay[i])}
                              placeholder="·"
                              readOnly={!editable || blocked}
                              aria-label={`${DAY_NAMES[i]} hours`}
                              onChange={(e) => {
                                let v = parseFloat(e.target.value);
                                if (Number.isNaN(v) || v < 0) v = 0;
                                if (v > 4) v = 4;
                                onHourChange(r.id, i, v);
                              }}
                            />
                          </td>
                        );
                      })}
                      <td className={styles.rowT}>{fmtH(sum(r.hoursByDay))}</td>
                      <td className={styles.tc}>
                        {editable && (
                          <button className={styles.editBtn} title="Edit line" onClick={() => onEditLine(r.id)}>
                            ✎
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}

            <tr className={styles.totRow}>
              <td>Daily total</td>
              <td />
              {dayTotals.map((t, i) => (
                <td key={i} className={`${styles.dt} ${cap[i] && t > cap[i] ? styles.over : cap[i] && t < cap[i] ? styles.short : ''}`}>
                  {fmtH(t)}
                </td>
              ))}
              <td className={styles.gt}>{fmtH(grandTotal)}</td>
              <td />
            </tr>
            <tr className={styles.totRow} style={{ opacity: 0.85 }}>
              <td style={{ fontWeight: 500, fontSize: 11 }}>Available capacity (after leave / holiday / weekly off)</td>
              <td />
              {cap.map((c, i) => (
                <td key={i} className={styles.dt} style={{ fontSize: 12, fontWeight: 500, opacity: 0.75 }}>
                  {c || '—'}
                </td>
              ))}
              <td className={styles.gt} style={{ fontSize: 13 }}>{fmtH(capTotal)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.gridFoot}>
        <div className={styles.legend}>
          <span><i className={`${styles.sw} ${styles.b}`} /> Billable</span>
          <span><i className={`${styles.sw} ${styles.n}`} /> Non-billable</span>
          <span><i className={styles.sw} style={{ background: 'var(--violetTint)', border: '1px solid var(--violetLine)' }} /> WFH</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,#FBE9E7 0 4px,#F5D9D6 4px 8px)' }} /> Leave (from Keka)</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,#FCF2E1 0 4px,#F6E7CB 4px 8px)' }} /> Holiday</span>
        </div>
        <div style={{ flex: 1 }} />
        {editable ? (
          <>
            <span style={{ fontSize: 11, color: 'var(--slate)' }}>Saved automatically as draft</span>
           <button
                className={`${controls.btn} ${controls.pri}`}
                onClick={onSubmit}
                disabled={!canSubmit}
                title={canSubmit ? undefined : 'Every working day must total exactly 8 hours before you can submit'}
              >
            Submit week for approval
          </button>
          </>
        ) : (
          status === 'PendingL1' && <button className={controls.btn} onClick={onRecall}>Recall submission</button>
        )}
      </div>
    </div>
  );
}
