import { useState } from 'react';
import { DatePicker } from '../ui/DatePicker';
import { useEmployeeProjectAllocations } from '../../hooks/api/useEmployees';
import { useMasterDataLookup } from '../../hooks/api/useMasterDataLookup';
import { useCreateUserStory, useUpdateUserStory, useUserStories } from '../../hooks/api/useUserStories';
import { ApiError } from '../../api/httpClient';
import type { UserStoryDto } from '../../api/types';
import { addDays, dayMonth, rangeLabel, todayLocalISO } from '../../lib/dates';
import controls from '../../styles/controls.module.css';
import styles from './UserStories.module.css';

interface UserStoryDrawerProps {
  employeeCode: string;
  /** Set to edit this story; leave out to create a new one. */
  existing?: UserStoryDto;
  /** Monday of the week on screen - a new story's dates default to that
   * week (Monday to Sunday). */
  weekStart?: string;
  onSaved: (story: UserStoryDto, wasUpdate: boolean) => void;
  onCancel: () => void;
}

/**
 * Create or edit a user story: name, project, start date and end date.
 * When creating, "Story history" lists the employee's past stories - picking
 * one fills the form, and saving updates THAT story with the new dates
 * (its earlier tasks stay in their weeks) instead of making a duplicate.
 */
export function UserStoryDrawer({ employeeCode, existing, weekStart, onSaved, onCancel }: UserStoryDrawerProps) {
  const { data: allocations } = useEmployeeProjectAllocations(employeeCode);
  const { data: stories } = useUserStories(employeeCode);
  const { projById } = useMasterDataLookup();
  const createStory = useCreateUserStory(employeeCode);
  const updateStory = useUpdateUserStory(employeeCode);

  // The story being edited: the one passed in, or one picked from history.
  const [selected, setSelected] = useState<UserStoryDto | undefined>(existing);
  const [name, setName] = useState(existing?.name ?? '');
  const [projectId, setProjectId] = useState<number | ''>(existing?.projectId ?? '');
  // New story: defaults to the selected week, Monday to Sunday (can be changed).
  const [startDate, setStartDate] = useState(existing?.startDate ?? weekStart ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? (weekStart ? addDays(weekStart, 6) : ''));
  const [showHistory, setShowHistory] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState('');

  const isEdit = selected !== undefined;
  const isPending = createStory.isPending || updateStory.isPending;

  // Same projects Add Task Line offers: the ones you're allocated to that are still active.
  const projects = (allocations ?? []).filter((a) => projById(a.projectId)?.isActive !== false);
  // No allocated projects (e.g. HR, Sales): the project is optional and the
  // story goes to the department's "Internal Work" project on the server.
  const allocationsLoaded = allocations !== undefined;
  const projectOptional = !isEdit && allocationsLoaded && projects.length === 0;
  // When editing, the story's own project is shown even if it has since dropped off that list.
  const showSelectedProject = isEdit && projects.every((p) => p.projectId !== selected.projectId);

  // Story history: stories whose end date has already passed.
  const today = todayLocalISO();
  const pastStories = (stories ?? []).filter((s) => s.endDate < today);

  const endBeforeStart = startDate !== '' && endDate !== '' && endDate < startDate;
  // No back dates: a new (or reused) story can't start before the selected
  // week's Monday. Editing an existing story keeps its own saved dates.
  const minStart = existing ? undefined : weekStart;
  const startTooEarly = Boolean(minStart && startDate !== '' && startDate < minStart);
  const defaultStart = weekStart ?? '';
  const defaultEnd = weekStart ? addDays(weekStart, 6) : '';

  function changeStartDate(value: string) {
    setStartDate(value);
    // Keep the end date on or after the start date.
    if (value && endDate && endDate < value) setEndDate(value);
    setServerError('');
  }

  function pickFromHistory(story: UserStoryDto) {
    setSelected(story);
    setName(story.name);
    setProjectId(story.projectId);
    // Reusing an old story: start from the selected week, not its old (past) dates.
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setShowHistory(false);
    setServerError('');
  }

  function startFresh() {
    setSelected(undefined);
    setName('');
    setProjectId('');
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setServerError('');
  }

  function handleSave() {
    const projectMissing = projectId === '' && !projectOptional;
    if (!name.trim() || projectMissing || !startDate || !endDate || endBeforeStart || startTooEarly) {
      setShowErrors(true);
      return;
    }
    const onError = (err: unknown) =>
      setServerError(err instanceof ApiError ? err.message : 'Could not save the user story');

    if (selected) {
      updateStory.mutate(
        { id: selected.id, body: { name: name.trim(), startDate, endDate } },
        { onSuccess: (story) => onSaved(story, true), onError },
      );
    } else {
      createStory.mutate(
        { name: name.trim(), projectId: projectId === '' ? null : projectId, startDate, endDate },
        { onSuccess: (story) => onSaved(story, false), onError },
      );
    }
  }

  return (
    <div>
      {selected && !existing && (
        <div className={styles.reuseNote}>
          Reusing <b>{selected.name}</b> ({rangeLabel(selected.startDate, selected.endDate)}). Change the dates and
          save - this story is updated and its earlier tasks stay in their weeks.{' '}
          <button type="button" className={styles.linkBtn} onClick={startFresh}>Start a new story instead</button>
        </div>
      )}

      <div className={controls.field}>
        <label htmlFor="storyName">User story name <span className={controls.req}>*</span></label>
        <input
          id="storyName"
          className={controls.textInput}
          autoFocus
          maxLength={200}
          value={name}
          placeholder="e.g. Employee management module"
          onChange={(e) => { setName(e.target.value); setServerError(''); }}
        />
        {showErrors && !name.trim() && <div className={styles.errMsg}>Enter a user story name.</div>}

        {!existing && pastStories.length > 0 && (
          <div className={styles.historyBox}>
            <button type="button" className={styles.linkBtn} onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? 'Hide story history' : `Story history (${pastStories.length})`}
            </button>
            {showHistory && (
              <ul className={styles.historyList}>
                {pastStories.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => pickFromHistory(s)}>
                      <span className={styles.historyName}>{s.name}</span>
                      <span className={styles.historyMeta}>{s.projectName} · {rangeLabel(s.startDate, s.endDate)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className={controls.field}>
        <label htmlFor="storyProject">Project {!projectOptional && <span className={controls.req}>*</span>}</label>
        <select
          id="storyProject"
          className={controls.select}
          value={projectId}
          disabled={isEdit || projectOptional}
          onChange={(e) => { setProjectId(e.target.value ? Number(e.target.value) : ''); setServerError(''); }}
        >
          <option value="">{projectOptional ? 'No project – internal work' : 'Select project'}</option>
          {selected && showSelectedProject && <option value={selected.projectId}>{selected.projectName}</option>}
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
          ))}
        </select>
        {showErrors && projectId === '' && !projectOptional && <div className={styles.errMsg}>Select the project this story belongs to.</div>}
        <div className={controls.hint}>
          {isEdit
            ? "The project can't be changed - this story's tasks are already logged against it."
            : projectOptional
              ? "You aren't allocated to any projects, so leave this empty - your time is logged as your department's internal work (non-billable)."
              : 'Only projects you are allocated to.'}
        </div>
      </div>

      <div className={styles.dateRow}>
        <div className={controls.field}>
          <label htmlFor="storyStart">Start Date <span className={controls.req}>*</span></label>
          <DatePicker rangeStart={startDate || undefined} rangeEnd={endDate || undefined}
            id="storyStart"
            value={startDate}
            min={minStart}
            onChange={(e) => changeStartDate(e.target.value)}
          />
          {showErrors && !startDate && <div className={styles.errMsg}>Pick a start date.</div>}
          {startTooEarly && minStart && <div className={styles.errMsg}>The start date can't be before {dayMonth(minStart)} (this week's start).</div>}
        </div>
        <div className={controls.field}>
          <label htmlFor="storyEnd">End Date <span className={controls.req}>*</span></label>
          <DatePicker rangeStart={startDate || undefined} rangeEnd={endDate || undefined}
            id="storyEnd"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => { setEndDate(e.target.value); setServerError(''); }}
          />
          {showErrors && !endDate && <div className={styles.errMsg}>Pick an end date.</div>}
          {endBeforeStart && <div className={styles.errMsg}>The end date can't be before the start date.</div>}
        </div>
      </div>
      <div className={controls.hint}>
        The story shows in the weeks between these dates, and hours can only be added on these days.
      </div>

      {serverError && <div className={styles.errMsg}>{serverError}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User Story'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
