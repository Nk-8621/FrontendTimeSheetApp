import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '../timesheet/Banner';
import { useWeek, useTimesheetMutations } from '../../hooks/api/useTimesheet';
import { useUserStories } from '../../hooks/api/useUserStories';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import type { UserStoryDto, WeekHours } from '../../api/types';
import { DAY_NAMES, DAY_STATUS_OPTIONS, DAY_TYPE_LABELS, MAX_HOURS_PER_LINE, dayEntryLimit } from '../../types/meridian';
import { addDays, dayMonth, isWithin, rangeLabel, rangesOverlap } from '../../lib/dates';
import controls from '../../styles/controls.module.css';
import styles from './UserStories.module.css';

interface StoryTaskDrawerProps {
  employeeCode: string;
  weekStart: string;
  /** Pre-selected story when adding from a story card. */
  defaultStoryId?: number;
  /** Set to edit an existing task; leave out to add a new one. */
  entryId?: number;
  onDone: () => void;
}

const EMPTY_HOURS = [0, 0, 0, 0, 0, 0, 0];

/**
 * Add or edit one task under a user story: the story, the task name and the
 * hours for each day. Reads the week itself (not from props) so the hours
 * left per day stay correct after "Add & Next Task".
 */
export function StoryTaskDrawer({ employeeCode, weekStart, defaultStoryId, entryId, onDone }: StoryTaskDrawerProps) {
  const { data: week } = useWeek(employeeCode, weekStart);
  const { data: stories } = useUserStories(employeeCode);
  const mutations = useTimesheetMutations(employeeCode, weekStart);
  const { toast, confirm } = useUI();

  const existing = entryId !== undefined ? week?.entries.find((e) => e.id === entryId) : undefined;

  const [storyId, setStoryId] = useState<number | ''>(existing?.userStoryId ?? defaultStoryId ?? '');
  const [taskName, setTaskName] = useState(existing?.note ?? '');
  const [hours, setHours] = useState<number[]>(existing ? [...existing.hoursByDay] : EMPTY_HOURS);
  const [error, setError] = useState('');

  if (!week) return <div className={controls.hint}>Loading this week…</div>;

  const editable = week.week.status === 'Draft' || week.week.status === 'Rejected';
  // Stories that run in this week (plus the task's own story when editing).
  const weekEnd = addDays(weekStart, 6);
  const storyOptions = (stories ?? []).filter(
    (s) => (s.isActive && rangesOverlap(s.startDate, s.endDate, weekStart, weekEnd)) || s.id === existing?.userStoryId,
  );
  const selectedStory = storyOptions.find((s) => s.id === storyId);

  // A day outside the selected story's start-end dates is closed for new hours.
  const isOutside = (story: UserStoryDto | undefined, i: number) =>
    story !== undefined && !isWithin(week.dayTypes[i].date, story.startDate, story.endDate);
  // DAY STATUS (Nov 2026): Working / Leave / WFH for a whole day. Saved right
  // away (it applies to the day, not just this task) and shown on My Timesheet.
  function changeDayStatus(dayIndex: number, date: string, dayType: string) {
    if (dayType === 'L') setHours((h) => h.map((x, idx) => (idx === dayIndex ? 0 : x))); // a leave day holds no hours
    if (dayType === 'LH') setHours((h) => h.map((x, idx) => (idx === dayIndex ? Math.min(x, 4) : x))); // half day: 4 h at most
    mutations.setDayType.mutate(
      { date, dayType },
      { onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not change the day status', 'bad') },
    );
  }

  const isPending = mutations.addStoryTask.isPending || mutations.updateEntry.isPending || mutations.removeEntry.isPending;

  // Hours already on each day from the OTHER lines of this week.
  const usedByOthers = week.dayTypes.map((_, i) =>
    week.entries.filter((e) => e.id !== existing?.id).reduce((total, e) => total + e.hoursByDay[i], 0),
  );
  // Most this task can hold on a day: 8 h per line, and the day can't go over
  // its available hours (8 h, or 4 h on a half-day leave).
  // Outside the story's dates, hours already saved there can only be reduced.
  const maxFor = (i: number) => {
    if (isOutside(selectedStory, i)) return existing?.hoursByDay[i] ?? 0;
    return Math.max(0, Math.min(MAX_HOURS_PER_LINE, dayEntryLimit(week.dayTypes[i]) - usedByOthers[i]));
  };

  function changeStory(newStoryId: number | '') {
    setStoryId(newStoryId);
    setError('');
    // Clear hours on days the newly picked story doesn't cover.
    const story = storyOptions.find((s) => s.id === newStoryId);
    setHours((h) => h.map((x, i) => (isOutside(story, i) ? 0 : x)));
  }

  function setDayHours(i: number, raw: string) {
    let v = parseFloat(raw);
    if (Number.isNaN(v) || v < 0) v = 0;
    const max = maxFor(i);
    const capped = v > max;
    v = Math.min(v, max);
    setHours((h) => h.map((x, idx) => (idx === i ? v : x)));
    // Typed more than the day has room for: the value is capped (same rule as
    // before) - say so instead of silently changing the number.
    setError(capped ? `${DAY_NAMES[i]} has ${max} h left for this task (a day holds at most ${dayEntryLimit(week!.dayTypes[i])} h).` : '');
  }

  function showError(err: unknown, fallback: string) {
    setError(err instanceof ApiError ? err.message : fallback);
  }

  function validate(): string {
    if (storyId === '') return 'Select a user story.';
    if (!taskName.trim()) return 'Enter the task name.';
    if (hours.every((h) => h === 0)) return 'Enter hours for at least one day.';
    return '';
  }

  function handleSave(addAnother: boolean) {
    const problem = validate();
    if (problem) { setError(problem); return; }
    const hoursByDay = hours as WeekHours;

    if (existing) {
      mutations.updateEntry.mutate(
        {
          id: existing.id,
          body: {
            note: taskName.trim(),
            hoursByDay,
            userStoryId: storyId !== existing.userStoryId ? (storyId as number) : undefined,
          },
        },
        {
          onSuccess: () => { onDone(); toast('Task updated', 'ok'); },
          onError: (err) => showError(err, 'Could not update the task'),
        },
      );
      return;
    }

    mutations.addStoryTask.mutate(
      { userStoryId: storyId as number, taskName: taskName.trim(), hoursByDay },
      {
        onSuccess: () => {
          if (addAnother) {
            setTaskName('');
            setHours(EMPTY_HOURS);
            toast('Task added - enter the next one', 'ok');
          } else {
            onDone();
            toast('Task added to this week', 'ok');
          }
        },
        onError: (err) => showError(err, 'Could not add the task'),
      },
    );
  }

  async function handleRemove() {
    if (!existing) return;
    const ok = await confirm({
      title: 'Remove task?',
      message: `"${existing.note ?? 'This task'}" and its hours will be removed from this week. This can't be undone.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    mutations.removeEntry.mutate(existing.id, {
      onSuccess: () => { onDone(); toast('Task removed'); },
      onError: (err) => showError(err, 'Could not remove the task'),
    });
  }

  if (!editable) {
    return <div className={controls.hint}>This week has been submitted, so its tasks can't be changed. Recall it from My Timesheet to edit.</div>;
  }

  return (
    <div>
      <div className={controls.field}>
        <label htmlFor="taskStory">User story <span className={controls.req}>*</span></label>
        <select
          id="taskStory"
          className={controls.select}
          value={storyId}
          onChange={(e) => changeStory(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select user story</option>
          {storyOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.projectName}</option>
          ))}
        </select>
      </div>

      <div className={controls.field}>
        <label htmlFor="taskName">Task <span className={controls.req}>*</span></label>
        <input
          id="taskName"
          className={controls.textInput}
          autoFocus
          maxLength={500}
          value={taskName}
          placeholder="What did you work on?"
          onChange={(e) => { setTaskName(e.target.value); setError(''); }}
        />
      </div>

      {(() => {
        // Working days this task could use (inside the story, not W-OFF / holiday / leave).
        const openDays = week.dayTypes
          .map((dt, i) => ({ dt, i }))
          .filter(({ dt, i }) => dt.capacityHours > 0 && !isOutside(selectedStory, i));
        const allFull = openDays.length > 0 && openDays.every(({ i }) => maxFor(i) === 0 && hours[i] === 0);
        if (!allFull) return null;
        return (
          <Banner kind="warn">
            <b>No hours left this week.</b> Every working day already has its full hours on other tasks
            ({openDays.map(({ i }) => `${DAY_NAMES[i]} ${usedByOthers[i]} h`).join(', ')}).
            A day holds at most 8 h, so to log time on this task, first reduce hours on another task.{' '}
            <Link to={`/?week=${weekStart}`}>Open this week in My Timesheet</Link>
          </Banner>
        );
      })()}

      <div className={controls.field}>
        <label>Hours <span className={controls.req}>*</span></label>
        <div className={styles.days}>
          {week.dayTypes.map((dt, i) => {
            const outside = isOutside(selectedStory, i);
            const isWeekOff = dt.dayType === 'O';
            const closed = dt.capacityHours === 0; // W-OFF, holiday and leave days take no hours
            const left = maxFor(i);
            // Shown under the box: what's still free after the hours typed here.
            const leftAfterTyping = Math.round(Math.max(0, left - hours[i]) * 100) / 100;
            const full = !closed && !outside && left === 0 && hours[i] === 0;
            const locked = (closed || outside || full) && hours[i] === 0;
            return (
              <div key={dt.date} className={`${styles.day} ${locked ? styles.closed : ''}`}>
                <div className={styles.dayName}>{DAY_NAMES[i]}</div>
                <div className={styles.dayDate}>{dayMonth(dt.date)}</div>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`${DAY_NAMES[i]} hours`}
                  value={hours[i] ? String(hours[i]) : ''}
                  placeholder={closed || outside ? '–' : '0'}
                  disabled={locked}
                  title={
                    !locked ? undefined
                      : closed || isWeekOff ? `${DAY_NAMES[i]} is ${DAY_TYPE_LABELS[dt.dayType]?.label ?? 'not a working day'} - no hours can be logged`
                      : outside ? `${DAY_NAMES[i]} is outside this story's dates`
                      : `${DAY_NAMES[i]} is full: ${usedByOthers[i]} h already logged on other tasks (a day holds at most ${dayEntryLimit(dt)} h)`
                  }
                  onChange={(e) => setDayHours(i, e.target.value)}
                />
                {/* A closed day shows its own label (W-OFF / Holiday / Leave) -
                    checked before "outside" so a weekend after the story ends
                    still reads W-OFF. */}
                <div className={styles.left}>{closed || isWeekOff ? DAY_TYPE_LABELS[dt.dayType]?.label ?? 'off' : outside ? 'No story added' : full ? `Day full · ${usedByOthers[i]} h used` : `${leftAfterTyping}h left`}</div>
                {/* DAY STATUS (Nov 2026): only on days the employee can change
                    (not W-OFF, holidays or KEKA / requested leave). */}
                {editable && dt.canChange && (
                  <select
                    className={`${styles.dayStatus} ${dt.dayType === 'L' || dt.dayType === 'LH' ? styles.dayStatusLv : dt.dayType === 'WFH' ? styles.dayStatusWfh : ''}`}
                    value={dt.dayType}
                    aria-label={`${DAY_NAMES[i]} status`}
                    disabled={mutations.setDayType.isPending}
                    onChange={(e) => changeDayStatus(i, dt.date, e.target.value)}
                  >
                    {DAY_STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
        <div className={controls.hint}>
          {selectedStory && <>Story runs {rangeLabel(selectedStory.startDate, selectedStory.endDate)} - working days outside it show "No story added" and are closed. </>}
          Fill in each day you worked on this task. A day holds at most 8 h (4 h on a half-day leave).
        </div>
      </div>

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={() => handleSave(false)} disabled={isPending}>
          {existing ? 'Save Changes' : 'Add Task'}
        </button>
        {!existing && (
          <button className={controls.btn} onClick={() => handleSave(true)} disabled={isPending}>Add &amp; Next Task</button>
        )}
        <button className={controls.btn} onClick={onDone}>Cancel</button>
        {existing && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={handleRemove} disabled={isPending}>Remove Task</button>
          </>
        )}
      </div>
    </div>
  );
}
