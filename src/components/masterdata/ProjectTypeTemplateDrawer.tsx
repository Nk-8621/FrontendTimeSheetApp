import { useState } from 'react';
import { useProjectTypeWithTemplate, useMasterDataMutations } from '../../hooks/api/useMasterData';
import { useUI } from '../ui/UIProvider';
import { ApiError } from '../../api/httpClient';
import type { ProjectTypeDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectTypeTemplateDrawerProps {
  projectType: ProjectTypeDto;
  onCancel: () => void;
}

/** Manages one Project Type's full Level-1 (module) / Level-2 (task)
 * template tree — the tree new Projects of this type get seeded from. */
export function ProjectTypeTemplateDrawer({ projectType, onCancel }: ProjectTypeTemplateDrawerProps) {
  const { data, isLoading, isError } = useProjectTypeWithTemplate(projectType.id);
  const mutations = useMasterDataMutations();
  const { toast } = useUI();

  const [newModuleName, setNewModuleName] = useState('');
  const [addingTaskForModuleId, setAddingTaskForModuleId] = useState<number | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [renamingModuleId, setRenamingModuleId] = useState<number | null>(null);
  const [renamingTaskId, setRenamingTaskId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  function nextModuleSortOrder() {
    return (data?.modules.reduce((max, m) => Math.max(max, m.sortOrder), 0) ?? 0) + 10;
  }
  function nextTaskSortOrder(moduleId: number) {
    const mod = data?.modules.find((m) => m.id === moduleId);
    return (mod?.tasks.reduce((max, t) => Math.max(max, t.sortOrder), 0) ?? 0) + 10;
  }

  function handleAddModule() {
    if (!newModuleName.trim()) return;
    mutations.createModuleTemplate.mutate(
      { projectTypeId: projectType.id, name: newModuleName.trim(), sortOrder: nextModuleSortOrder() },
      {
        onSuccess: () => setNewModuleName(''),
        onError: (err) => showError(err, 'Could not add this module template'),
      },
    );
  }

  function handleAddTask(moduleTemplateId: number) {
    if (!newTaskName.trim()) return;
    mutations.createTaskTemplate.mutate(
      { projectTypeModuleTemplateId: moduleTemplateId, name: newTaskName.trim(), sortOrder: nextTaskSortOrder(moduleTemplateId) },
      {
        onSuccess: () => { setNewTaskName(''); setAddingTaskForModuleId(null); },
        onError: (err) => showError(err, 'Could not add this task template'),
      },
    );
  }

  function startRenameModule(id: number, currentName: string) {
    setRenamingModuleId(id); setRenamingTaskId(null); setRenameValue(currentName);
  }
  function startRenameTask(id: number, currentName: string) {
    setRenamingTaskId(id); setRenamingModuleId(null); setRenameValue(currentName);
  }
  function commitRenameModule() {
    if (renamingModuleId === null || !renameValue.trim()) { setRenamingModuleId(null); return; }
    mutations.updateModuleTemplate.mutate(
      { id: renamingModuleId, body: { name: renameValue.trim() } },
      { onError: (err) => showError(err, 'Could not rename this module template') },
    );
    setRenamingModuleId(null);
  }
  function commitRenameTask() {
    if (renamingTaskId === null || !renameValue.trim()) { setRenamingTaskId(null); return; }
    mutations.updateTaskTemplate.mutate(
      { id: renamingTaskId, body: { name: renameValue.trim() } },
      { onError: (err) => showError(err, 'Could not rename this task template') },
    );
    setRenamingTaskId(null);
  }

  function handleDeleteModule(id: number) {
    if (!window.confirm('Remove this module template? Existing Projects/Modules already created from it are unaffected.')) return;
    mutations.deleteModuleTemplate.mutate(id, { onError: (err) => showError(err, 'Could not remove this module template') });
  }
  function handleDeleteTask(id: number) {
    mutations.deleteTaskTemplate.mutate(id, { onError: (err) => showError(err, 'Could not remove this task template') });
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        This is the Level-1/Level-2 template new "{projectType.name}" projects are seeded with at creation.
        Changes here only affect projects created from now on.
      </div>

      {isLoading && <div className={controls.hint}>Loading template…</div>}
      {isError && <div className={styles.errMsg}>Couldn't load this project type's template.</div>}

      {data?.modules.map((mod) => (
        <div key={mod.id} style={{ border: '1px solid var(--rule)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {renamingModuleId === mod.id ? (
              <input
                className={controls.textInput}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRenameModule}
                onKeyDown={(e) => e.key === 'Enter' && commitRenameModule()}
              />
            ) : (
              <b style={{ flex: 1 }}>{mod.name}</b>
            )}
            <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => startRenameModule(mod.id, mod.name)}>✎</button>
            <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => handleDeleteModule(mod.id)}>✕</button>
          </div>

          <div style={{ paddingLeft: 14 }}>
            {mod.tasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                {renamingTaskId === t.id ? (
                  <input
                    className={controls.textInput}
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRenameTask}
                    onKeyDown={(e) => e.key === 'Enter' && commitRenameTask()}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 12.5 }}>{t.name}</span>
                )}
                <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => startRenameTask(t.id, t.name)}>✎</button>
                <button className={styles.ph} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => handleDeleteTask(t.id)}>✕</button>
              </div>
            ))}

            {addingTaskForModuleId === mod.id ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  className={controls.textInput}
                  autoFocus
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Task name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask(mod.id)}
                />
                <button className={`${controls.btn} ${controls.sm} ${controls.pri}`} onClick={() => handleAddTask(mod.id)}>Add</button>
                <button className={`${controls.btn} ${controls.sm}`} onClick={() => { setAddingTaskForModuleId(null); setNewTaskName(''); }}>Cancel</button>
              </div>
            ) : (
              <button className={`${controls.btn} ${controls.sm} ${controls.gh}`} style={{ marginTop: 6 }} onClick={() => { setAddingTaskForModuleId(mod.id); setNewTaskName(''); }}>
                + Add task
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input
          className={controls.textInput}
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
          placeholder="New module name"
          onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
        />
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleAddModule}>+ Add module</button>
      </div>

      <div className={styles.footer}>
        <button className={controls.btn} onClick={onCancel}>Close</button>
      </div>
    </div>
  );
}
