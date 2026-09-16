import { useState } from 'react';
import type { ModuleDto, ProjectDto, WorkTaskDto } from '../../api/types';
import { ApiError } from '../../api/httpClient';
import { useUI } from '../ui/UIProvider';
import controls from '../../styles/controls.module.css';
import errStyles from '../timesheet/EntryDrawer.module.css';
import pageStyles from '../../pages/MasterData.module.css';

const MAX_TASKS_ON_CREATE = 6;

interface ModulesTasksMutations {
  createModule: { mutateAsync: (body: { projectId: number; name: string; projectTypeId?: number | null }) => Promise<ModuleDto> };
  updateModule: { mutateAsync: (args: { id: number; body: { name?: string; projectTypeId?: number | null } }) => Promise<ModuleDto> };
  createTask: { mutateAsync: (body: { moduleId: number; name: string }) => Promise<WorkTaskDto> };
  updateTask: { mutateAsync: (args: { id: number; body: { name?: string } }) => Promise<WorkTaskDto> };
}

interface ModulesTasksPanelProps {
  projects: ProjectDto[];
  modules: ModuleDto[];
  tasks: WorkTaskDto[];
  mutations: ModulesTasksMutations;
}

/** Replaces the old separate "Modules" and "Tasks" tabs with a single
 * project-scoped view: pick a project, see its modules and their tasks as
 * an expandable tree, and add a new module together with its tasks in one
 * step. Modeled directly on ProjectTypeTemplateDrawer's tree pattern, but
 * against the live Module/WorkTask records instead of Project Type
 * templates — and with no delete here (per product decision, existing
 * live Modules/Tasks are never removed from this screen).
 *
 * Module/task creation loops the existing single-create mutations
 * (createModule then createTask per task name) rather than a new combined
 * backend endpoint — the same "loop the single call, aggregate results"
 * approach already used for multi-department project creation. Duplicate
 * names are checked both here (instant feedback) and on the server
 * (RequireNoDuplicateModuleNameAsync / RequireNoDuplicateTaskNameAsync in
 * MasterDataService), matching the same belt-and-suspenders pattern used
 * for Project codes and Holidays. */
export function ModulesTasksPanel({ projects, modules, tasks, mutations }: ModulesTasksPanelProps) {
  const { toast } = useUI();
  const [projectId, setProjectId] = useState<number | ''>('');

  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleTasks, setNewModuleTasks] = useState<string[]>(['']);
  const [creatingModule, setCreatingModule] = useState(false);
  const [createError, setCreateError] = useState('');

  const [newTaskName, setNewTaskName] = useState<Record<number, string>>({});
  const [addingTaskToModuleId, setAddingTaskToModuleId] = useState<number | null>(null);

  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  const selectedProject = projectId === '' ? undefined : projects.find((p) => p.id === projectId);
  const projectModules = projectId === '' ? [] : modules.filter((m) => m.projectId === projectId);

  function tasksFor(moduleId: number) {
    return tasks.filter((t) => t.moduleId === moduleId);
  }

  function resetAddModuleForm() {
    setNewModuleName('');
    setNewModuleTasks(['']);
    setCreateError('');
  }

  function handleTaskInputChange(index: number, value: string) {
    setNewModuleTasks((cur) => cur.map((t, i) => (i === index ? value : t)));
  }

  function handleAddTaskRow() {
    setNewModuleTasks((cur) => (cur.length >= MAX_TASKS_ON_CREATE ? cur : [...cur, '']));
  }

  function handleRemoveTaskRow(index: number) {
    setNewModuleTasks((cur) => (cur.length <= 1 ? cur : cur.filter((_, i) => i !== index)));
  }

  async function handleCreateModule() {
    if (projectId === '') {
      setCreateError('Select a project first.');
      return;
    }
    const moduleName = newModuleName.trim();
    if (!moduleName) {
      setCreateError('Module name is required.');
      return;
    }
    if (modules.some((m) => m.projectId === projectId && m.name.toLowerCase() === moduleName.toLowerCase())) {
      setCreateError(`A module named "${moduleName}" already exists for this project.`);
      return;
    }

    const taskNames = newModuleTasks.map((t) => t.trim()).filter(Boolean);
    if (taskNames.length === 0) {
      setCreateError('Add at least one task for this module.');
      return;
    }
    if (taskNames.length > MAX_TASKS_ON_CREATE) {
      setCreateError(`Add at most ${MAX_TASKS_ON_CREATE} tasks at a time.`);
      return;
    }
    const lowerNames = taskNames.map((t) => t.toLowerCase());
    const hasDuplicateTask = lowerNames.some((n, i) => lowerNames.indexOf(n) !== i);
    if (hasDuplicateTask) {
      setCreateError('Task names must be different from each other.');
      return;
    }

    setCreateError('');
    setCreatingModule(true);
    try {
      const createdModule = await mutations.createModule.mutateAsync({ projectId, name: moduleName, projectTypeId: null });

      const results = await Promise.allSettled(
        taskNames.map((name) => mutations.createTask.mutateAsync({ moduleId: createdModule.id, name })),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed === 0) {
        toast(`Module "${moduleName}" created with ${taskNames.length} task${taskNames.length !== 1 ? 's' : ''}`, 'ok');
      } else {
        toast(`Module "${moduleName}" created, but ${failed} of ${taskNames.length} task(s) could not be added`, 'bad');
      }
      resetAddModuleForm();
    } catch (err) {
      showError(err, 'Could not create this module');
    } finally {
      setCreatingModule(false);
    }
  }

  function handleAddTaskToModule(moduleId: number) {
    const name = (newTaskName[moduleId] ?? '').trim();
    if (!name) return;
    if (tasksFor(moduleId).some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      toast(`A task named "${name}" already exists under this module`, 'bad');
      return;
    }
    setAddingTaskToModuleId(moduleId);
    mutations.createTask.mutateAsync({ moduleId, name })
      .then(() => setNewTaskName((cur) => ({ ...cur, [moduleId]: '' })))
      .catch((err) => showError(err, 'Could not add this task'))
      .finally(() => setAddingTaskToModuleId(null));
  }

  function startRenameModule(mod: ModuleDto) {
    setEditingModuleId(mod.id);
    setEditingTaskId(null);
    setEditValue(mod.name);
    setEditError('');
  }

  function startRenameTask(t: WorkTaskDto) {
    setEditingTaskId(t.id);
    setEditingModuleId(null);
    setEditValue(t.name);
    setEditError('');
  }

  function handleRenameModule(mod: ModuleDto) {
    const name = editValue.trim();
    if (!name) { setEditingModuleId(null); return; }
    if (name.toLowerCase() !== mod.name.toLowerCase()
      && modules.some((m) => m.projectId === mod.projectId && m.id !== mod.id && m.name.toLowerCase() === name.toLowerCase())) {
      setEditError(`A module named "${name}" already exists for this project.`);
      return;
    }
    mutations.updateModule.mutateAsync({ id: mod.id, body: { name } })
      .then(() => setEditingModuleId(null))
      .catch((err) => showError(err, 'Could not rename this module'));
  }

  function handleRenameTask(t: WorkTaskDto) {
    const name = editValue.trim();
    if (!name) { setEditingTaskId(null); return; }
    if (name.toLowerCase() !== t.name.toLowerCase()
      && tasksFor(t.moduleId).some((o) => o.id !== t.id && o.name.toLowerCase() === name.toLowerCase())) {
      setEditError(`A task named "${name}" already exists under this module.`);
      return;
    }
    mutations.updateTask.mutateAsync({ id: t.id, body: { name } })
      .then(() => setEditingTaskId(null))
      .catch((err) => showError(err, 'Could not rename this task'));
  }

  return (
    <div className={pageStyles.card} style={{ padding: 16 }}>
      <div className={controls.field} style={{ maxWidth: 420 }}>
        <label>Project</label>
        <select
          className={controls.select}
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value ? Number(e.target.value) : ''); resetAddModuleForm(); }}
        >
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} [{p.code}]</option>)}
        </select>
      </div>

      {selectedProject && (
        selectedProject.projectTypeName ? (
          <div
            style={{
              marginTop: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              fontSize: 13,
              color: 'var(--oxide)',
            }}
          >
            Project type: {selectedProject.projectTypeName}
          </div>
        ) : (
          <div className={controls.hint} style={{ marginTop: 10 }}>No project type set for this project.</div>
        )
      )}

      {projectId === '' && (
        <div className={controls.hint} style={{ marginTop: 12 }}>Pick a project to see its modules and tasks.</div>
      )}

      {projectId !== '' && (
        <>
          {projectModules.length === 0 && (
            <div className={controls.hint} style={{ margin: '12px 0' }}>No modules yet for this project — add the first one below.</div>
          )}

          {projectModules.map((mod) => (
            <div key={mod.id} style={{ marginTop: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {editingModuleId === mod.id ? (
                  <>
                    <input
                      className={controls.textInput}
                      style={{ flex: 1 }}
                      value={editValue}
                      autoFocus
                      onChange={(e) => { setEditValue(e.target.value); setEditError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameModule(mod); if (e.key === 'Escape') setEditingModuleId(null); }}
                    />
                    <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleRenameModule(mod)}>Save</button>
                    <button className={`${controls.btn} ${controls.sm}`} onClick={() => setEditingModuleId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <b style={{ flex: 1 }}>{mod.name}</b>
                    <span className={controls.hint}>{tasksFor(mod.id).length} task{tasksFor(mod.id).length !== 1 ? 's' : ''}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => startRenameModule(mod)}>✎</button>
                  </>
                )}
              </div>
              {editingModuleId === mod.id && editError && <div className={errStyles.errMsg} style={{ marginBottom: 6 }}>{editError}</div>}

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tasksFor(mod.id).map((t) => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0 3px 14px', fontSize: 13 }}>
                    {editingTaskId === t.id ? (
                      <>
                        <input
                          className={controls.textInput}
                          style={{ flex: 1 }}
                          value={editValue}
                          autoFocus
                          onChange={(e) => { setEditValue(e.target.value); setEditError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTask(t); if (e.key === 'Escape') setEditingTaskId(null); }}
                        />
                        <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleRenameTask(t)}>Save</button>
                        <button className={`${controls.btn} ${controls.sm}`} onClick={() => setEditingTaskId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: 'var(--slate)' }}>{t.name}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => startRenameTask(t)}>✎</button>
                      </>
                    )}
                  </li>
                ))}
                {editingTaskId !== null && editError && tasksFor(mod.id).some((t) => t.id === editingTaskId) && (
                  <li style={{ color: 'var(--clay)', fontSize: 12.5, padding: '2px 0 0 14px' }}>{editError}</li>
                )}
                <li style={{ display: 'flex', gap: 6, padding: '5px 0 0 14px' }}>
                  <input
                    className={controls.textInput}
                    style={{ flex: 1, fontSize: 12.5 }}
                    placeholder="Add a task…"
                    value={newTaskName[mod.id] ?? ''}
                    onChange={(e) => setNewTaskName((cur) => ({ ...cur, [mod.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTaskToModule(mod.id); }}
                  />
                  <button
                    className={`${controls.btn} ${controls.sm}`}
                    disabled={addingTaskToModuleId === mod.id}
                    onClick={() => handleAddTaskToModule(mod.id)}
                  >
                    + Add task
                  </button>
                </li>
              </ul>
            </div>
          ))}

          <div className={controls.field} style={{ marginTop: 20 }}>
            <label>Add a module</label>
            <input
              className={controls.textInput}
              placeholder="e.g. Design"
              value={newModuleName}
              onChange={(e) => { setNewModuleName(e.target.value); setCreateError(''); }}
            />
          </div>

          <div className={controls.field}>
            <label>Tasks for this module <span className={controls.hint} style={{ fontWeight: 400 }}>(1 to {MAX_TASKS_ON_CREATE})</span></label>
            {newModuleTasks.map((value, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  className={controls.textInput}
                  style={{ flex: 1 }}
                  placeholder={`Task ${i + 1}`}
                  value={value}
                  onChange={(e) => { handleTaskInputChange(i, e.target.value); setCreateError(''); }}
                />
                <button
                  className={`${controls.btn} ${controls.sm}`}
                  onClick={() => handleRemoveTaskRow(i)}
                  disabled={newModuleTasks.length <= 1}
                  title="Remove this task"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className={`${controls.btn} ${controls.sm}`}
              onClick={handleAddTaskRow}
              disabled={newModuleTasks.length >= MAX_TASKS_ON_CREATE}
            >
              + Another task
            </button>
          </div>

          {createError && <div className={errStyles.errMsg} style={{ marginBottom: 8 }}>{createError}</div>}

          <button className={`${controls.btn} ${controls.pri}`} onClick={handleCreateModule} disabled={creatingModule}>
            {creatingModule ? 'Creating…' : 'Create module & tasks'}
          </button>
        </>
      )}
    </div>
  );
}
