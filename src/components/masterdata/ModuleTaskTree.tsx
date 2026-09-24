import { useState } from 'react';
import type { ModuleDto, WorkTaskDto } from '../../api/types';
import { ApiError } from '../../api/httpClient';
import { useUI } from '../ui/UIProvider';
import controls from '../../styles/controls.module.css';
import errStyles from '../timesheet/EntryDrawer.module.css';

const MAX_TASKS_ON_CREATE = 6;

export interface ModuleTaskTreeMutations {
  createModule: { mutateAsync: (body: { projectId: number; name: string; projectTypeId?: number | null }) => Promise<ModuleDto> };
  updateModule: { mutateAsync: (args: { id: number; body: { name?: string; projectTypeId?: number | null } }) => Promise<ModuleDto> };
  createTask: { mutateAsync: (body: { moduleId: number; name: string }) => Promise<WorkTaskDto> };
  updateTask: { mutateAsync: (args: { id: number; body: { name?: string } }) => Promise<WorkTaskDto> };
}

interface ModuleTaskTreeProps {
  projectId: number;
  /** Already filtered to this project. */
  modules: ModuleDto[];
  /** Already filtered to this project's modules. */
  tasks: WorkTaskDto[];
  mutations: ModuleTaskTreeMutations;
  /** Distinct module names already in use anywhere in the system — powers a
   * type-to-filter suggestion list on "Add a module" so a common name
   * (Development, Testing, Bug Fixing…) doesn't have to be retyped from
   * scratch every time. Picking a suggestion still creates a brand-new
   * Module row scoped to this project — Modules aren't shared records, only
   * their names are being suggested. */
  moduleNameSuggestions?: string[];
  /** Same idea, for the "Add a task" inputs. */
  taskNameSuggestions?: string[];
  /** Compact mode drops the outer card chrome — used when this tree is
   * embedded inside another panel (the guided project setup flow) that
   * already provides its own card/section framing. */
  embedded?: boolean;
}

/** The Module/Task-Type tree for one project: expandable modules, each with
 * its tasks, inline rename, "+ Add task", and a "create module + its first
 * tasks in one step" form at the bottom. Shared by the standalone "Modules &
 * Task Types" tab (ModulesTasksPanel, which adds the project picker around
 * this) and the guided "Set up project" flow (which already knows the
 * project and renders this directly) — one tree implementation instead of
 * two copies drifting apart.
 *
 * Loops the existing single-create mutations (createModule then createTask
 * per task name) rather than a combined backend endpoint — same
 * "loop the single call, aggregate results" approach used for multi-
 * department project creation. Duplicate names are checked here for instant
 * feedback and on the server (RequireNoDuplicateModuleNameAsync /
 * RequireNoDuplicateTaskNameAsync in MasterDataService) — belt and
 * suspenders, matching Project codes and Holidays. */
export function ModuleTaskTree({
  projectId, modules, tasks, mutations, moduleNameSuggestions = [], taskNameSuggestions = [], embedded = false,
}: ModuleTaskTreeProps) {
  const { toast } = useUI();

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
    const moduleName = newModuleName.trim();
    if (!moduleName) {
      setCreateError('Module name is required.');
      return;
    }
    if (modules.some((m) => m.name.toLowerCase() === moduleName.toLowerCase())) {
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
      && modules.some((m) => m.id !== mod.id && m.name.toLowerCase() === name.toLowerCase())) {
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
    <div style={embedded ? undefined : { padding: 16 }}>
      <datalist id="module-name-suggestions">
        {moduleNameSuggestions.map((n) => <option key={n} value={n} />)}
      </datalist>
      <datalist id="task-name-suggestions">
        {taskNameSuggestions.map((n) => <option key={n} value={n} />)}
      </datalist>

      {modules.length === 0 && (
        <div className={controls.hint} style={{ margin: '0 0 12px' }}>No modules yet for this project — add the first one below.</div>
      )}

      {modules.map((mod) => (
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
                list="task-name-suggestions"
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
          placeholder="e.g. Design — start typing to see names already used elsewhere"
          list="module-name-suggestions"
          value={newModuleName}
          onChange={(e) => { setNewModuleName(e.target.value); setCreateError(''); }}
        />
        <div className={controls.hint}>Suggestions include module names already used on other projects — pick one to keep naming consistent, or type a new name.</div>
      </div>

      <div className={controls.field}>
        <label>Tasks for this module <span className={controls.hint} style={{ fontWeight: 400 }}>(1 to {MAX_TASKS_ON_CREATE})</span></label>
        {newModuleTasks.map((value, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              className={controls.textInput}
              style={{ flex: 1 }}
              placeholder={`Task ${i + 1}`}
              list="task-name-suggestions"
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
    </div>
  );
}
