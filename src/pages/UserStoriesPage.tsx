import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { StatusPill } from '../components/ui/StatusPill';
import { Banner } from '../components/timesheet/Banner';
import { StoryCard } from '../components/userStories/StoryCard';
import { NewUserStoryDrawer } from '../components/userStories/NewUserStoryDrawer';
import { StoryTaskDrawer } from '../components/userStories/StoryTaskDrawer';
import { useUI } from '../components/ui/UIProvider';
import { useSession } from '../session/SessionContext';
import { useWeek } from '../hooks/api/useTimesheet';
import { useUserStories } from '../hooks/api/useUserStories';
import { mondayOf, addDays, toISO } from '../lib/dates';
import type { UserStoryDto, TimeEntryDto } from '../api/types';
import controls from '../styles/controls.module.css';
import styles from '../components/userStories/UserStories.module.css';

/** The local calendar date (YYYY-MM-DD) a story was created on. The API
 * sends CreatedAt in UTC, sometimes without the trailing "Z". */
function createdOnDate(createdAt: string): string {
  const hasZone = /[zZ]$|[+-]\d\d:\d\d$/.test(createdAt);
  const d = new Date(hasZone ? createdAt : `${createdAt}Z`);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Which stories to show for the selected week: a story shows if it has
 * tasks in that week, or if it already existed by the end of that week
 * (so it doesn't appear in weeks before it was created). */
function storiesForWeek(stories: UserStoryDto[], weekEntries: TimeEntryDto[], weekStart: string): UserStoryDto[] {
  const weekEnd = addDays(weekStart, 6);
  return stories.filter((s) => {
    const hasTasksThisWeek = weekEntries.some((e) => e.userStoryId === s.id);
    const existedThisWeek = s.isActive && createdOnDate(s.createdAt) <= weekEnd;
    return hasTasksThisWeek || existedThisWeek;
  });
}

/**
 * User Stories: the employee creates a story (name + project) and adds the
 * tasks they worked on under it, with hours per day. Each task is a normal
 * timesheet line, so it shows up in My Timesheet for the same week.
 */
export function UserStoriesPage() {
  const { employeeCode } = useSession();
  const { openDrawer, closeDrawer, toast } = useUI();
  const [searchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => {
    const requested = searchParams.get('week');
    return requested ? mondayOf(requested) : mondayOf(toISO(new Date()));
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: stories, isError: storiesError } = useUserStories(employeeCode);
  const { data: week, isError: weekError } = useWeek(employeeCode, weekStart);

  const editable = week ? week.week.status === 'Draft' || week.week.status === 'Rejected' : false;
  const visibleStories = storiesForWeek(stories ?? [], week?.entries ?? [], weekStart);

  function toggle(storyId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId); else next.add(storyId);
      return next;
    });
  }

  function openNewStory() {
    openDrawer({
      title: 'New user story',
      body: (
        <NewUserStoryDrawer
          employeeCode={employeeCode}
          onCancel={closeDrawer}
          onCreated={(story) => {
            closeDrawer();
            setExpanded((prev) => new Set(prev).add(story.id));
            toast('User story created - now add its tasks', 'ok');
          }}
        />
      ),
    });
  }

  function openAddTask(storyId: number, storyName: string) {
    openDrawer({
      title: 'Add task',
      subtitle: storyName,
      body: <StoryTaskDrawer employeeCode={employeeCode} weekStart={weekStart} defaultStoryId={storyId} onDone={closeDrawer} />,
    });
  }

  function openEditTask(entryId: number) {
    openDrawer({
      title: 'Edit task',
      body: <StoryTaskDrawer employeeCode={employeeCode} weekStart={weekStart} entryId={entryId} onDone={closeDrawer} />,
    });
  }

  return (
    <>
      <PageHeader crumb="My Work" title="User Stories">
        <WeekNav weekStart={weekStart} onShift={(d) => setWeekStart((w) => addDays(w, d * 7))} />
        {week && <StatusPill status={week.week.status} />}
        <button className={`${controls.btn} ${controls.pri}`} onClick={openNewStory}>+ New user story</button>
      </PageHeader>

      <div className="page-content">
        {(storiesError || weekError) && (
          <Banner kind="reject">Couldn't load your user stories - check that the backend API is running and reachable.</Banner>
        )}

        <p className={styles.intro}>
          <span>Open a story and add the tasks you worked on, with hours for each day. They appear in My Timesheet for this week.</span>
          <Link to={`/?week=${weekStart}`}>View in My Timesheet →</Link>
        </p>

        {week && !editable && (
          <div className={styles.locked}>This week has been submitted, so tasks can't be added or changed. Recall it from My Timesheet to edit.</div>
        )}

        {stories && week && visibleStories.length === 0 && (
          <div className={styles.empty}>
            {stories.length === 0 ? (
              <>
                <div className={styles.big}>No user stories yet</div>
                Create your first user story, then add the tasks you work on under it.
              </>
            ) : (
              <>
                <div className={styles.big}>No user stories in this week</div>
                Your user stories start from the week they were created. Use the arrows to go to a later week, or create a new story.
              </>
            )}
          </div>
        )}

        <div className={styles.list}>
          {visibleStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              tasks={(week?.entries ?? []).filter((e) => e.userStoryId === story.id)}
              expanded={expanded.has(story.id)}
              editable={editable}
              onToggle={() => toggle(story.id)}
              onAddTask={() => openAddTask(story.id, story.name)}
              onEditTask={openEditTask}
            />
          ))}
        </div>
      </div>
    </>
  );
}
