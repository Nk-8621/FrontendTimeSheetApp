import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { WeekNav } from '../components/timesheet/WeekNav';
import { StatusPill } from '../components/ui/StatusPill';
import { Banner } from '../components/timesheet/Banner';
import { StoryCard } from '../components/userStories/StoryCard';
import { UserStoryDrawer } from '../components/userStories/UserStoryDrawer';
import { StoryTaskDrawer } from '../components/userStories/StoryTaskDrawer';
import { useUI } from '../components/ui/UIProvider';
import { useSession } from '../session/SessionContext';
import { useWeek } from '../hooks/api/useTimesheet';
import { useUserStories } from '../hooks/api/useUserStories';
import { mondayOf, addDays, toISO, rangesOverlap } from '../lib/dates';
import type { UserStoryDto, TimeEntryDto } from '../api/types';
import controls from '../styles/controls.module.css';
import styles from '../components/userStories/UserStories.module.css';

/** Which stories to show for the selected week: a story shows if its
 * start-end dates overlap the week, or if it already has tasks in that week
 * (kept as history even after its dates were moved). */
function storiesForWeek(stories: UserStoryDto[], weekEntries: TimeEntryDto[], weekStart: string): UserStoryDto[] {
  const weekEnd = addDays(weekStart, 6);
  return stories.filter((s) => {
    const hasTasksThisWeek = weekEntries.some((e) => e.userStoryId === s.id);
    const runsThisWeek = s.isActive && rangesOverlap(s.startDate, s.endDate, weekStart, weekEnd);
    return hasTasksThisWeek || runsThisWeek;
  });
}

/**
 * User Stories: the employee creates a story (name, project, start and end
 * dates) and adds the
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

  function openStoryDrawer(existing?: UserStoryDto) {
    openDrawer({
      title: existing ? 'Edit user story' : 'New user story',
      body: (
        <UserStoryDrawer
          employeeCode={employeeCode}
          existing={existing}
          onCancel={closeDrawer}
          onSaved={(story, wasUpdate) => {
            closeDrawer();
            setExpanded((prev) => new Set(prev).add(story.id));
            toast(wasUpdate ? 'User story updated' : 'User story created - now add its tasks', 'ok');
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
        <button className={`${controls.btn} ${controls.pri}`} onClick={() => openStoryDrawer()}>+ New user story</button>
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
                A story shows only in the weeks between its start and end dates. Use the arrows to go to another week, or create a new story.
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
              runsThisWeek={rangesOverlap(story.startDate, story.endDate, weekStart, addDays(weekStart, 6))}
              expanded={expanded.has(story.id)}
              editable={editable}
              onToggle={() => toggle(story.id)}
              onAddTask={() => openAddTask(story.id, story.name)}
              onEditTask={openEditTask}
              onEditStory={() => openStoryDrawer(story)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
