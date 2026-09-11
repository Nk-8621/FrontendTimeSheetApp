import { useState } from 'react';
import { useMasterDataMutations, useProjectTypesWithTemplates } from '../../hooks/api/useMasterData';
import { ApiError } from '../../api/httpClient';
import { useUI } from '../ui/UIProvider';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

interface ProjectTypeTemplateDrawerProps {
  projectTypeId: number;
  typeName: string;
  onClose: () => void;
}

/** Manages one Project Type's full Level-1 (Module) / Level-2 (Task)
 * template tree. Unlike the other Master Data drawers (one field set, one
 * onSave), this one has many small independent actions — add/rename/delete
 * per module and per task — so it drives its own mutations directly rather
 * than threading a dozen callbacks through MasterDataPage.
 *
 * Reads the tree straight from useProjectTypesWithTemplates() by id (rather
 * than taking it as a static prop) so it re-renders with fresh data after
 * every mutation — a prop captured once at openDrawer() time would freeze
 * at whatever the tree looked like when the drawer was opened, since the
 * drawer's body is a plain React element stored in UIProvider's state, not
 * something that re-evaluates on its own when the query cache updates. */
export function ProjectTypeTemplateDrawer({ projectTypeId, typeName, onClose }: ProjectTypeTemplateDrawerProps) {
  const mutations = useMasterDataMutations();
  const projectTypesWithTemplates = useProjectTypesWithTemplates();
  const { toast } = useUI();
  const type = projectTypesWithTemplates.data?.find((t) => t.id === projectTypeId);
  const [newModuleName, setNewModuleName] = useState('');
  const [newTaskName, setNewTaskName] = useState<Record<number, string>>({});
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function showError(err: unknown, fallback: string) {
    toast(err instanceof ApiError ? err.message : fallback, 'bad');
  }

  if (!type) {
    return (
      <div>
        <div className={controls.hint}>Loading…</div>
        <div className={styles.footer}>
          <button className={controls.btn} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const modules = [...type.modules].sort((a, b) => a.sortOrder - b.sortOrder);

  function handleAddModule() {
    if (!newModuleName.trim()) return;
    const nextSort = modules.length > 0 ? Math.max(...modules.map((m) => m.sortOrder)) + 1 : 1;
    mutations.createModuleTemplate.mutate(
      { projectTypeId, name: newModuleName.trim(), sortOrder: nextSort },
      { onSuccess: () => setNewModuleName(''), onError: (err) => showError(err, 'Could not add this module') },
    );
  }

  function handleAddTask(moduleTemplateId: number, tasks: { sortOrder: number }[]) {
    const name = (newTaskName[moduleTemplateId] ?? '').trim();
    if (!name) return;
    const nextSort = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sortOrder)) + 1 : 1;
    mutations.createTaskTemplate.mutate(
      { projectTypeModuleTemplateId: moduleTemplateId, name, sortOrder: nextSort },
      {
        onSuccess: () => setNewTaskName((cur) => ({ ...cur, [moduleTemplateId]: '' })),
        onError: (err) => showError(err, 'Could not add this task'),
      },
    );
  }

  function handleRenameModule(id: number) {
    if (!editValue.trim()) { setEditingModuleId(null); return; }
    mutations.updateModuleTemplate.mutate(
      { id, body: { name: editValue.trim() } },
      { onSuccess: () => setEditingModuleId(null), onError: (err) => showError(err, 'Could not rename this module') },
    );
  }

  function handleRenameTask(id: number) {
    if (!editValue.trim()) { setEditingTaskId(null); return; }
    mutations.updateTaskTemplate.mutate(
      { id, body: { name: editValue.trim() } },
      { onSuccess: () => setEditingTaskId(null), onError: (err) => showError(err, 'Could not rename this task') },
    );
  }

  function handleDeleteModule(id: number, name: string) {
    if (!window.confirm(`Remove the "${name}" module template? Its task templates go with it. This only affects future projects — existing Modules/Tasks already created from it are untouched.`)) return;
    mutations.deleteModuleTemplate.mutate(id, { onError: (err) => showError(err, 'Could not remove this module') });
  }

  function handleDeleteTask(id: number, name: string) {
    if (!window.confirm(`Remove the "${name}" task template?`)) return;
    mutations.deleteTaskTemplate.mutate(id, { onError: (err) => showError(err, 'Could not remove this task') });
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 14 }}>
        This template drives what auto-generates when a new project is created with the <b>{typeName}</b> Project Type.
        Changes here only affect projects created from now on.
      </div>

      {modules.map((mod) => (
        <div key={mod.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {editingModuleId === mod.id ? (
              <>
                <input
                  className={controls.textInput}
                  style={{ flex: 1 }}
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameModule(mod.id); if (e.key === 'Escape') setEditingModuleId(null); }}
                />
                <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleRenameModule(mod.id)}>Save</button>
                <button className={`${controls.btn} ${controls.sm}`} onClick={() => setEditingModuleId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <b style={{ flex: 1 }}>{mod.name}</b>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setEditingModuleId(mod.id); setEditValue(mod.name); }}>✎</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => handleDeleteModule(mod.id, mod.name)}>✕</button>
              </>
            )}
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {[...mod.tasks].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => (
              <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0 3px 14px', fontSize: 13 }}>
                {editingTaskId === t.id ? (
                  <>
                    <input
                      className={controls.textInput}
                      style={{ flex: 1 }}
                      value={editValue}
                      autoFocus
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTask(t.id); if (e.key === 'Escape') setEditingTaskId(null); }}
                    />
                    <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleRenameTask(t.id)}>Save</button>
                    <button className={`${controls.btn} ${controls.sm}`} onClick={() => setEditingTaskId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, color: 'var(--slate)' }}>{t.name}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setEditingTaskId(t.id); setEditValue(t.name); }}>✎</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay)' }} onClick={() => handleDeleteTask(t.id, t.name)}>✕</button>
                  </>
                )}
              </li>
            ))}
            <li style={{ display: 'flex', gap: 6, padding: '5px 0 0 14px' }}>
              <input
                className={controls.textInput}
                style={{ flex: 1, fontSize: 12.5 }}
                placeholder="Add a task…"
                value={newTaskName[mod.id] ?? ''}
                onChange={(e) => setNewTaskName((cur) => ({ ...cur, [mod.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(mod.id, mod.tasks); }}
              />
              <button className={`${controls.btn} ${controls.sm}`} onClick={() => handleAddTask(mod.id, mod.tasks)}>+ Add task</button>
            </li>
          </ul>
        </div>
      ))}

      <div className={controls.field}>
        <label>Add a module</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className={controls.textInput}
            style={{ flex: 1 }}
            placeholder="e.g. Design"
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddModule(); }}
          />
          <button className={`${controls.btn} ${controls.pri} ${controls.sm}`} onClick={handleAddModule}>+ Add module</button>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={controls.btn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
