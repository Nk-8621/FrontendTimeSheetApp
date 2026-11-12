import { useState } from 'react';
import { useWeek, useTimesheetMutations } from '../../hooks/api/useTimesheet';
import { useUserStories } from '../../hooks/api/useUserStories';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import type { UserStoryDto, WeekHours } from '../../api/types';
import { DAY_NAMES, MAX_HOURS_PER_LINE } from '../../types/meridian';
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
 * left per day stay correct after "Add & next task".
 */
export function StoryTaskDrawer({ employeeCode, weekStart, defaultStoryId, entryId, onDone }: StoryTaskDrawerProps) {
  const { data: week } = useWeek(employeeCode, weekStart);
  const { data: stories } = useUserStories(employeeCode);
  const mutations = useTimesheetMutations(employeeCode, weekStart);
  const { toast } = useUI();

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
    return Math.max(0, Math.min(MAX_HOURS_PER_LINE, week.dayTypes[i].capacityHours - usedByOthers[i]));
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
    v = Math.min(v, maxFor(i));
    setHours((h) => h.map((x, idx) => (idx === i ? v : x)));
    setError('');
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

  function handleRemove() {
    if (!existing) return;
    if (!window.confirm('Remove this task and its hours from the week? This can\'t be undone.')) return;
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

      <div className={controls.field}>
        <label>Hours <span className={controls.req}>*</span></label>
        <div className={styles.days}>
          {week.dayTypes.map((dt, i) => {
            const outside = isOutside(selectedStory, i);
            const closed = dt.capacityHours === 0;
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
                  onChange={(e) => setDayHours(i, e.target.value)}
                />
                <div className={styles.left}>{outside ? 'outside' : closed ? 'off' : full ? 'full' : `${leftAfterTyping}h left`}</div>
              </div>
            );
          })}
        </div>
        <div className={controls.hint}>
          {selectedStory && <>Story runs {rangeLabel(selectedStory.startDate, selectedStory.endDate)} - days outside it are closed. </>}
          Fill in each day you worked on this task. A day holds at most 8 h (4 h on a half-day leave).
        </div>
      </div>

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={() => handleSave(false)} disabled={isPending}>
          {existing ? 'Save changes' : 'Add task'}
        </button>
        {!existing && (
          <button className={controls.btn} onClick={() => handleSave(true)} disabled={isPending}>Add &amp; next task</button>
        )}
        <button className={controls.btn} onClick={onDone}>Cancel</button>
        {existing && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={handleRemove} disabled={isPending}>Remove task</button>
          </>
        )}
      </div>
    </div>
  );
}
