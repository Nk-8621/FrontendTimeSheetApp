import type { TimeEntryDto, UserStoryDto } from '../../api/types';
import { DAY_NAMES } from '../../types/meridian';
import { rangeLabel } from '../../lib/dates';
import controls from '../../styles/controls.module.css';
import styles from './UserStories.module.css';

interface StoryCardProps {
  story: UserStoryDto;
  /** This week's tasks under the story. */
  tasks: TimeEntryDto[];
  /** False when the story is shown only as history (its dates don't cover this week). */
  runsThisWeek: boolean;
  expanded: boolean;
  editable: boolean;
  onToggle: () => void;
  onAddTask: () => void;
  onEditTask: (entryId: number) => void;
  onEditStory: () => void;
  onDeleteStory: () => void;
}

const fmtH = (n: number) => String(Math.round(n * 100) / 100);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** "Mon 4 · Tue 3" - the days a task has hours on. */
function daysText(hoursByDay: number[]) {
  return hoursByDay
    .map((h, i) => (h ? `${DAY_NAMES[i]} ${fmtH(h)}` : ''))
    .filter(Boolean)
    .join(' · ');
}

/** One user story with this week's tasks under it. */
export function StoryCard({ story, tasks, runsThisWeek, expanded, editable, onToggle, onAddTask, onEditTask, onEditStory, onDeleteStory }: StoryCardProps) {
  const storyHours = sum(tasks.map((t) => sum(t.hoursByDay)));

  return (
    <div className={`${styles.card} ${expanded ? styles.open : ''}`}>
      {/* The whole head opens/closes the card. The ✎ next to the name opens Edit
          story instead (stopPropagation keeps it from also toggling the card). */}
      <div className={styles.cardHead} onClick={onToggle}>
        <button
          type="button"
          className={styles.chev}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Hide' : 'Show'} tasks for ${story.name}`}
        >
          ▶
        </button>
        <span>
          <span className={styles.nameRow}>
            <span className={styles.name}>{story.name}</span>
            <button
              type="button"
              className={styles.editBtn}
              title="Edit story"
              aria-label={`Edit story ${story.name}`}
              onClick={(e) => { e.stopPropagation(); onEditStory(); }}
            >
              ✎
            </button>
          </span>
          <span className={styles.meta}>
            <span className={styles.project}>{story.projectName}</span>
            <span className={styles.range}>{rangeLabel(story.startDate, story.endDate)}</span>
            <span>{tasks.length} task{tasks.length === 1 ? '' : 's'} this week</span>
          </span>
        </span>
        <span className={styles.hoursBig}><b>{fmtH(storyHours)}</b>h this week</span>
      </div>

      {expanded && (
        <div className={styles.tasks}>
          {tasks.length === 0 && <div className={styles.noTasks}>No tasks in this week yet.</div>}
          {tasks.map((t) => (
            <div key={t.id} className={styles.task}>
              <div>
                <div className={styles.taskName}>{t.note}</div>
                <div className={styles.taskDays}>{daysText(t.hoursByDay)}</div>
              </div>
              <span className={styles.taskHours}>{fmtH(sum(t.hoursByDay))} h</span>
              {editable ? (
                <button type="button" className={styles.editBtn} title="Edit task" aria-label={`Edit task ${t.note ?? ''}`} onClick={() => onEditTask(t.id)}>✎</button>
              ) : <span />}
            </div>
          ))}
          <div className={`${styles.cardFoot} ${styles.cardActions}`}>
            <button
              type="button"
              className={`${controls.btn} ${controls.sm}`}
              onClick={onAddTask}
              disabled={!editable || !story.isActive || !runsThisWeek}
              title={!editable ? 'This week has been submitted' : !runsThisWeek ? "This week is outside the story's dates" : undefined}
            >
              + Add task
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={onDeleteStory}
              disabled={story.taskCount > 0}
              title={story.taskCount > 0 ? 'Remove its tasks first - only a story with no tasks can be deleted' : 'Delete story'}
              aria-label={`Delete story ${story.name}`}
            >
              🗑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
