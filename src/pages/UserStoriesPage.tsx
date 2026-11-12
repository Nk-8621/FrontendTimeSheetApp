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
import { useDeleteUserStory, useUserStories } from '../hooks/api/useUserStories';
import { ApiError } from '../api/httpClient';
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
  const { openDrawer, closeDrawer, toast, confirm } = useUI();
  const [searchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => {
    const requested = searchParams.get('week');
    return requested ? mondayOf(requested) : mondayOf(toISO(new Date()));
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: stories, isError: storiesError } = useUserStories(employeeCode);
  const { data: week, isError: weekError } = useWeek(employeeCode, weekStart);
  const deleteStory = useDeleteUserStory(employeeCode);

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

  async function handleDeleteStory(story: UserStoryDto) {
    // Always clickable (a grey button looks broken); a story with tasks just explains why it can't go.
    if (story.taskCount > 0) {
      toast(`"${story.name}" has tasks logged under it - remove its tasks first, then delete the story.`, 'bad');
      return;
    }
    const ok = await confirm({
      title: 'Delete user story?',
      message: `"${story.name}" will be deleted. This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteStory.mutate(story.id, {
      onSuccess: () => toast('User story deleted', 'ok'),
      onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not delete the user story', 'bad'),
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
      <PageHeader crumb="My Work" title="User Stories" />

      <div className="page-content">
        {(storiesError || weekError) && (
          <Banner kind="reject">Couldn't load your user stories - check that the backend API is running and reachable.</Banner>
        )}

        {/* Week, its status and New user story sit at the top right of the page. */}
        <div className={styles.toolbar}>
          <WeekNav weekStart={weekStart} onShift={(d) => setWeekStart((w) => addDays(w, d * 7))} />
          {week && <StatusPill status={week.week.status} />}
          <button className={`${controls.btn} ${controls.pri}`} onClick={() => openStoryDrawer()}>+ New user story</button>
        </div>

        {week && !editable && (
          <div className={styles.locked}>This week has been submitted, so tasks can't be added or changed. Recall it from My Timesheet to edit.</div>
        )}

        {stories && week && visibleStories.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.big}>No user story found</div>
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
              onDeleteStory={() => handleDeleteStory(story)}
            />
          ))}
        </div>

        {visibleStories.length > 0 && (
          <div className={styles.viewTimesheet}>
            <Link to={`/?week=${weekStart}`}>View Timesheet →</Link>
          </div>
        )}
      </div>
    </>
  );
}
