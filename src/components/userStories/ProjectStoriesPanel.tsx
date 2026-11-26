import { useState } from 'react';
import { useUI } from '../ui/UIProvider';
import { useCreateStoryName, useManagedProjects, useUpdateStoryName } from '../../hooks/api/useUserStories';
import { ApiError } from '../../api/httpClient';
import type { ManagedProjectDto, ProjectStoryNameDto } from '../../api/types';
import { dayMonth } from '../../lib/dates';
import { Banner } from '../timesheet/Banner';
import controls from '../../styles/controls.module.css';
import drawerStyles from '../timesheet/EntryDrawer.module.css';
import styles from './ProjectStories.module.css';

/** "1 Dec 2026" */
function fullDate(iso: string): string {
  return `${dayMonth(iso)} ${iso.slice(0, 4)}`;
}

function projectDatesLabel(p: ManagedProjectDto): string {
  if (!p.startDate) return 'Start date not set';
  return `${fullDate(p.startDate)} – ${p.endDate ? fullDate(p.endDate) : 'no end date'}`;
}

interface StoryNameFormProps {
  projectName: string;
  /** Set to rename this name; leave out to add a new one. */
  existing?: ProjectStoryNameDto;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

/** Small form to add or rename one story name. */
function StoryNameForm({ projectName, existing, onSave, onCancel }: StoryNameFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError('Enter a story name.');
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the story name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Project</label>
        <div className={controls.textInput} style={{ color: 'var(--slate)' }}>{projectName}</div>
      </div>
      <div className={controls.field}>
        <label htmlFor="storyNameInput">Story name <span className={controls.req}>*</span></label>
        <input
          id="storyNameInput"
          className={controls.textInput}
          autoFocus
          maxLength={200}
          value={name}
          placeholder="e.g. Employee management module"
          onChange={(e) => { setName(e.target.value); setError(''); }}
        />
        <div className={controls.hint}>
          {existing
            ? "Stories your team already made keep their old name - only new stories use the new name."
            : 'Everyone allocated to this project can pick this name when they create a user story.'}
        </div>
      </div>
      {error && <div className={drawerStyles.errMsg}>{error}</div>}
      <div className={drawerStyles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Story Name'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/**
 * Project Stories tab (managers and admins): add user story names for a
 * project. Everyone allocated to that project sees these names when they
 * create a user story - they can pick one, or still type their own.
 */
export function ProjectStoriesPanel() {
  const { openDrawer, closeDrawer, toast, confirm } = useUI();
  const { data: projects, isError } = useManagedProjects(true);
  const createName = useCreateStoryName();
  const updateName = useUpdateStoryName();

  function openAdd(project: ManagedProjectDto) {
    openDrawer({
      title: 'Add Story Name',
      size: 'centerSmall',
      body: (
        <StoryNameForm
          projectName={project.projectName}
          onCancel={closeDrawer}
          onSave={async (name) => {
            await createName.mutateAsync({ projectId: project.projectId, name });
            closeDrawer();
            toast('Story name added', 'ok');
          }}
        />
      ),
    });
  }

  function openRename(project: ManagedProjectDto, storyName: ProjectStoryNameDto) {
    openDrawer({
      title: 'Rename Story Name',
      size: 'centerSmall',
      body: (
        <StoryNameForm
          projectName={project.projectName}
          existing={storyName}
          onCancel={closeDrawer}
          onSave={async (name) => {
            await updateName.mutateAsync({ id: storyName.id, body: { name } });
            closeDrawer();
            toast('Story name updated', 'ok');
          }}
        />
      ),
    });
  }

  async function toggleActive(storyName: ProjectStoryNameDto) {
    if (storyName.isActive) {
      const ok = await confirm({
        title: 'Close story name?',
        message: `"${storyName.name}" will no longer be offered to your team. Stories already made from it stay as they are.`,
        confirmLabel: 'Close',
        danger: true,
      });
      if (!ok) return;
    }
    updateName.mutate(
      { id: storyName.id, body: { isActive: !storyName.isActive } },
      {
        onSuccess: () => toast(storyName.isActive ? 'Story name closed' : 'Story name reopened', 'ok'),
        onError: (err) => toast(err instanceof ApiError ? err.message : 'Could not update the story name', 'bad'),
      },
    );
  }

  if (isError) {
    return <Banner kind="reject">Couldn't load your projects - check that the backend API is running and reachable.</Banner>;
  }

  return (
    <div>
      <div className={styles.intro}>
        Add user story names for your projects. Everyone allocated to the project can pick them when they create a
        user story - they can still type their own name if needed.
      </div>

      {projects && projects.length === 0 && (
        <div className={styles.noNames}>You don't have any active projects to add story names for.</div>
      )}

      <div className={styles.list}>
        {(projects ?? []).map((project) => (
          <div key={project.projectId} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.projectName}>{project.projectName}</span>
              <span className={styles.client}>{project.clientName}</span>
              <span className={styles.dates}>{projectDatesLabel(project)}</span>
              <span className={styles.grow} />
              <button className={`${controls.btn} ${controls.sm}`} onClick={() => openAdd(project)}>Add Story Name</button>
            </div>

            {project.storyNames.length === 0 ? (
              <div className={styles.noNames}>No story names yet.</div>
            ) : (
              <ul className={styles.names}>
                {project.storyNames.map((n) => (
                  <li key={n.id} className={n.isActive ? undefined : styles.closed}>
                    <span className={styles.nameText}>{n.name}</span>
                    <span className={styles.meta}>
                      Used by {n.usedByEmployees} {n.usedByEmployees === 1 ? 'employee' : 'employees'}
                    </span>
                    {n.isActive && (
                      <button className={`${controls.btn} ${controls.sm}`} onClick={() => openRename(project, n)}>Rename</button>
                    )}
                    <button className={`${controls.btn} ${controls.sm}`} onClick={() => toggleActive(n)}>
                      {n.isActive ? 'Close' : 'Reopen'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
