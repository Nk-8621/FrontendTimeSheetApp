import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { useSession } from '../../session/SessionContext';
import { Link } from 'react-router-dom';
import type { TimeEntryDto, DayTypeDto } from '../../api/types';
import { CLASSIFICATION_SHORT_LABELS, DAY_NAMES, DAY_TYPE_LABELS, MAX_HOURS_PER_LINE, dayEntryLimit } from '../../types/meridian';
import { useMasterDataLookup } from '../../hooks/api/useMasterDataLookup';
import { useEmployeeProjectAllocations } from '../../hooks/api/useEmployees';
import { isWithin, rangeLabel } from '../../lib/dates';
import { ImportExcelButton } from './ImportExcelButton';
import { DownloadTemplateButton } from './DownloadTemplateButton';
import controls from '../../styles/controls.module.css';
import { Icon } from '../ui/Icon';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  employeeCode: string;
  weekStart: string;
  rows: TimeEntryDto[];
  dayTypes: DayTypeDto[];
  editable: boolean;
  /** Mirrors WeekApprovalService.RecallAsync: PendingL1, or PendingL2 when
   * the week skipped Level 1 and nobody has approved it yet. */
  canRecall: boolean;
  onHourChange: (entryId: number, dayIndex: number, value: number) => void;
  onCycleClassification: (entry: TimeEntryDto) => void;
  onEditLine: (entryId: number) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  /** Short note beside a disabled Submit button, e.g. "2 working days not complete". */
  submitBlockedReason?: string;
  /** Day-by-day list shown when hovering over that note. */
  submitBlockedDetails?: string;
  onRecall: () => void;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + (b || 0), 0);
const fmtH = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '—');
const today = () => new Date().toISOString().slice(0, 10);

/** Task lines shown before the grid starts scrolling. */
const VISIBLE_TASK_LINES = 4;

export function WeekGrid({
  employeeCode,
  weekStart,
  rows,
  dayTypes,
  editable,
  canRecall,
  onHourChange,
  onCycleClassification,
  onEditLine,
  onSubmit,
  canSubmit,
  submitBlockedReason,
  submitBlockedDetails,
  onRecall,
}: WeekGridProps) {
  const { accById, projById, projAccountId, modName, taskName } = useMasterDataLookup();
  const { data: myAllocations } = useEmployeeProjectAllocations(employeeCode);
  // Billing classification is set by the admin at project-allocation time,
  // not chosen per line - the cycle-to-change button on this grid only
  // still works for a line whose project has no allocation (a not-yet-
  // reviewed "+ Others" project), same exception EntryDrawer makes.
  const allocatedProjectIds = new Set((myAllocations ?? []).map((a) => a.projectId));

  const days = dayTypes.map((d) => d.date);
  const cap = dayTypes.map((d) => d.capacityHours);
  const capTotal = sum(cap);
  const dayTotals = days.map((_, i) => sum(rows.map((r) => r.hoursByDay[i] || 0)));
  const grandTotal = sum(dayTotals);
  const todayIso = today();
  const { nav } = useSession();

  // More than 4 task lines: show the first 4 and scroll the rest inside the
  // grid (day header and totals stay fixed). The height is measured from the
  // real rows, so it fits exactly 4 lines whatever their content.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [maxGridHeight, setMaxGridHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const taskRows = box.querySelectorAll<HTMLTableRowElement>('tr[data-task-row]');
    if (taskRows.length <= VISIBLE_TASK_LINES) {
      setMaxGridHeight(undefined);
      return;
    }
    const firstHidden = taskRows[VISIBLE_TASK_LINES];
    const footer = box.querySelector('tfoot');
    const horizontalScrollbar = box.offsetHeight - box.clientHeight; // when the grid also scrolls sideways
    setMaxGridHeight(firstHidden.offsetTop + (footer?.offsetHeight ?? 0) + horizontalScrollbar);
  }, [rows]);

  // One group per project + user story (in the order the lines arrive), so
  // the story is named once in the group header instead of on every task.
  // Older lines without a story are grouped per project, as before.
  const groups: { key: string; projectId: number; story: TimeEntryDto | null; rows: TimeEntryDto[] }[] = [];
  rows.forEach((r) => {
    const hasStory = r.userStoryId !== null && r.userStoryId !== undefined;
    const key = `${r.projectId}|${hasStory ? r.userStoryId : '-'}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, projectId: r.projectId, story: hasStory ? r : null, rows: [] };
      groups.push(group);
    }
    group.rows.push(r);
  });

  return (
    <div className={styles.gridWrap}>
      <div className={styles.cardHd}>
        <div className={styles.titleBlock}>
          <h3>Weekly timesheet</h3>
          <span className={styles.sub}>Hours per task for each day of the week</span>
        </div>
        <span className={`${styles.weekSum} ${capTotal && grandTotal >= capTotal ? styles.weekSumDone : ''}`} title="Logged / available hours this week">
          <b>{fmtH(grandTotal) === '—' ? '0' : fmtH(grandTotal)}</b> / {fmtH(capTotal) === '—' ? '0' : fmtH(capTotal)} h logged
        </span>
        <div style={{ flex: 1 }} />
        {editable && (
          <>
            <ImportExcelButton employeeCode={employeeCode} weekStart={weekStart} />
            <DownloadTemplateButton />
          </>
        )}
      </div>
      <div ref={scrollRef} className={styles.gridScroll} style={{ maxHeight: maxGridHeight }}>
        <table className={styles.wk}>
          <thead>
            <tr>
              <th className={styles.hier}>User story › Task</th>
              <th className={styles.bcol}>Type</th>
              {days.map((d, i) => {
                const t = dayTypes[i].dayType;
                const pct = cap[i] ? Math.min(100, (dayTotals[i] / cap[i]) * 100) : dayTotals[i] ? 100 : 0;
                const capClass = cap[i] && dayTotals[i] > cap[i] ? styles.over : cap[i] && dayTotals[i] >= cap[i] ? styles.full : '';
                return (
                  <th
                    key={d}
                    className={`${styles.dayHd} ${styles.dcol} ${t === 'O' ? styles.wknd : ''} ${d === todayIso ? styles.today : ''}`}
                  >
                    <div className={styles.inner}>
                      <div className={styles.dn}>{DAY_NAMES[i]}</div>
                      <div className={styles.dd}>{new Date(d).getUTCDate()}</div>
                    </div>
                    {/* DAY STATUS (Nov 2026): shown as a label here - it's picked in the
                        Add Task drawer (User Stories). */}
                    <span className={`${styles.dtBtn} ${styles[DAY_TYPE_LABELS[t].css] ?? ''}`}>
                      {DAY_TYPE_LABELS[t].label}
                    </span>
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
                    <div className={styles.big}>No tasks logged for this week yet</div>
                    Tasks you add under a user story appear here with their hours.
                    {editable && nav.includes('stories') && (
                      <div style={{ marginTop: 12 }}>
                        <Link to={`/stories?week=${weekStart}`} className={`${controls.btn} ${controls.pri} ${controls.sm}`}>
                          Add tasks from User Stories →
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {groups.map((group) => {
              const pid = group.projectId;
              const accountId = projAccountId(pid);
              const acc = accountId !== undefined ? accById(accountId) : undefined;
              const proj = projById(pid);
              const story = group.story;
              const storyDates = story?.userStoryStartDate && story.userStoryEndDate
                ? rangeLabel(story.userStoryStartDate, story.userStoryEndDate)
                : null;
              return (
                <Fragment key={group.key}>
                  <tr className={styles.subRow}>
                    <td colSpan={11}>
                      {/* Client › Project › User story (department and client type left out on purpose). */}
                      <div className={styles.projPath}>
                        <Icon name="folder" className={styles.projIcon} />
                        <span className={styles.projMuted}>{acc?.name ?? '—'}</span>
                        <Icon name="chevronRight" className={styles.projSep} />
                        <span className={styles.projName}>{proj?.name}</span>
                        {proj?.code && <span className={styles.projCode}>{proj.code}</span>}
                        {story && (
                          <>
                            <Icon name="chevronRight" className={styles.projSep} />
                            <Icon name="stories" className={styles.storyIcon} />
                            <span className={styles.storyName}>{story.userStoryName}</span>
                            {storyDates && <span className={styles.storyDates}>{storyDates}</span>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {group.rows.map((r) => (
                    <tr key={r.id} data-task-row>
                      <td className={styles.hier}>
                        {r.userStoryId !== null && r.userStoryId !== undefined ? (
                          // Task added under a user story: the story is in the group
                          // header above, so the row shows just the task name.
                          <div className={styles.hcell}>
                            <div className={styles.htask} title={r.note ?? undefined}>{r.note}</div>
                          </div>
                        ) : (
                          // Older line (Add task line / Excel import): Module › Task + description.
                          <div className={styles.hcell}>
                            <div className={styles.hpath}><b>{modName(r.moduleId)}</b></div>
                            <div className={styles.htask}>{taskName(r.taskId)}</div>
                            {r.note && <div className={styles.hnote}>{r.note}</div>}
                          </div>
                        )}
                      </td>
                      <td className={styles.tc}>
                        {editable && !allocatedProjectIds.has(r.projectId) ? (
                          <button
                            className={`${styles.bt} ${r.classification === 'Billable' ? styles.b : r.classification === 'PartialBillable' ? styles.pb : styles.n}`}
                            onClick={() => onCycleClassification(r)}
                            title="Click to cycle Billable / Non-billable / Partial billable"
                          >
                            {CLASSIFICATION_SHORT_LABELS[r.classification]}
                          </button>
                        ) : (
                          <span
                            className={`${styles.bt} ${r.classification === 'Billable' ? styles.b : r.classification === 'PartialBillable' ? styles.pb : styles.n}`}
                            title={editable ? 'Set by your admin for this project' : undefined}
                          >
                            {CLASSIFICATION_SHORT_LABELS[r.classification]}
                          </span>
                        )}
                      </td>
                      {days.map((_, i) => {
                        const t = dayTypes[i].dayType;
                        const blocked = t === 'L' || t === 'H';
                        // Any working day can be typed into directly - the same task on
                        // another day (e.g. Tuesday) needs no new line or description.
                        // Days with no available hours stay locked, unless the line
                        // already has hours there so they can be cleared.
                        const claimed = r.hoursByDay[i] > 0;
                        // A user story task can't get hours outside the story's dates
                        // (hours already there can still be reduced or cleared).
                        const outsideStory = Boolean(r.userStoryStartDate && r.userStoryEndDate)
                          && !isWithin(days[i], r.userStoryStartDate!, r.userStoryEndDate!);
                        const open = (dayEntryLimit(dayTypes[i]) > 0 && !outsideStory) || claimed;
                        // A W-OFF day is closed to entry like a holiday, with the same
                        // hatched look - unless hours are already there to clear.
                        const weeklyOff = t === 'O' && !claimed;
                        const cls = [
                          styles.hr,
                          blocked ? (t === 'L' ? styles.blocked : styles.blockedH) : '',
                          weeklyOff ? styles.blockedO : t === 'O' ? styles.wknd : '',
                          !editable || (!blocked && !open) ? styles.locked : '',
                          days[i] === todayIso ? styles.todayCol : '',
                          r.hoursByDay[i] > 0 ? styles.filled : '',
                        ].join(' ');
                        return (
                          <td key={i} className={cls}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fmtH(r.hoursByDay[i]) === '—' ? '' : fmtH(r.hoursByDay[i])}
                              placeholder="–"
                              readOnly={!editable || blocked || !open}
                              tabIndex={blocked || weeklyOff ? -1 : undefined}
                              title={editable && !blocked && !open ? (outsideStory ? 'No story added for this day' : 'No working hours on this day') : undefined}
                              aria-label={`${DAY_NAMES[i]} hours`}
                              onChange={(e) => {
                                let v = parseFloat(e.target.value);
                                if (Number.isNaN(v) || v < 0) v = 0;
                                // A line holds at most 8 h, and the whole day can't go
                                // over its available hours (8 h, or 4 h on a half-day leave).
                                const leftInDay = Math.max(0, dayEntryLimit(dayTypes[i]) - (dayTotals[i] - r.hoursByDay[i]));
                                v = Math.min(v, MAX_HOURS_PER_LINE, leftInDay);
                                if (outsideStory) v = Math.min(v, r.hoursByDay[i]);
                                onHourChange(r.id, i, v);
                              }}
                            />
                          </td>
                        );
                      })}
                      <td className={styles.rowT}>{fmtH(sum(r.hoursByDay))}</td>
                      <td className={styles.tc}>
                        {editable && (
                          <>
                           <button className={styles.editBtn} title="Edit task" aria-label={`Edit task ${r.note ?? taskName(r.taskId)}`} onClick={() => onEditLine(r.id)}>
                              <Icon name="edit" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
          {/* Totals stay pinned at the bottom while the task rows scroll. */}
          <tfoot>
            <tr className={styles.totRow}>
              <td>Daily total</td>
              <td />
              {dayTotals.map((t, i) => (
                <td
                  key={i}
                  className={`${styles.dt} ${cap[i] && t > cap[i] ? styles.over : cap[i] && t < cap[i] ? styles.short : cap[i] && t === cap[i] ? styles.done : ''} ${days[i] === todayIso ? styles.todayCol : ''}`}
                  title={cap[i] ? `${fmtH(t) === '—' ? 0 : fmtH(t)} of ${cap[i]} h` : undefined}
                >
                  <span className={styles.dtVal}>{fmtH(t)}</span>
                </td>
              ))}
              <td className={styles.gt}>{fmtH(grandTotal)}</td>
              <td />
            </tr>
            <tr className={`${styles.totRow} ${styles.capRow}`}>
              <td className={styles.capLbl}>Available capacity <span>(after leave / holiday / W-OFF)</span></td>
              <td />
              {cap.map((c, i) => (
                <td key={i} className={`${styles.dt} ${days[i] === todayIso ? styles.todayCol : ''}`}>
                  {c || '—'}
                </td>
              ))}
              <td className={styles.gt}>{fmtH(capTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.legendBar}>
        <div className={styles.legend}>
          <span><i className={`${styles.sw} ${styles.b}`} /> Billable</span>
          <span><i className={`${styles.sw} ${styles.pb}`} /> Partial billable</span>
          <span><i className={`${styles.sw} ${styles.n}`} /> Non-billable</span>
          <span><i className={styles.sw} style={{ background: 'var(--violetTint)', border: '1px solid var(--violetLine)' }} /> WFH</span>
          <span><i className={styles.sw} style={{ background: 'var(--verdTint)', border: '1px solid var(--verdLine)' }} /> On Duty</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,var(--leaveA) 0 4px,var(--leaveB) 4px 8px)' }} /> Leave (Keka or an approved/pending full-day request)</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,var(--leaveA) 0 4px,var(--leaveHalfB) 4px 8px)' }} /> Half-day leave (still open for 4h)</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,var(--holidayA) 0 4px,var(--holidayB) 4px 8px)' }} /> Holiday</span>
          <span><i className={styles.sw} style={{ background: 'repeating-linear-gradient(45deg,var(--woffA) 0 4px,var(--woffB) 4px 8px)' }} /> W-OFF</span>
        </div>
      </div>

      {(editable || canRecall) && (
        <div className={styles.gridFoot}>
          {editable ? (
            <>
              <span
                className={`${styles.status} ${!canSubmit && submitBlockedReason ? styles.statusWarn : styles.statusOk}`}
                title={!canSubmit && submitBlockedDetails ? submitBlockedDetails : undefined}
              >
                <Icon name={!canSubmit && submitBlockedReason ? 'alert' : 'checkCircle'} />
                {!canSubmit && submitBlockedReason ? submitBlockedReason : 'Saved automatically as draft'}
              </span>
              <div className={styles.actions}>
                <button
                  className={`${controls.btn} ${controls.pri}`}
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  title={canSubmit ? undefined : 'Every working day must total exactly its available hours (8 h, or 4 h on a half-day leave) before you can submit'}
                >
                  <Icon name="send" />
                  Submit
                </button>
              </div>
            </>
          ) : (
            <>
              <span className={`${styles.status} ${styles.statusInfo}`}>
                <Icon name="info" />
                Submitted for approval. Recall it to make changes.
              </span>
              <div className={styles.actions}>
                <button className={controls.btn} onClick={onRecall}>
                  <Icon name="undo" />
                  Recall submission
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
