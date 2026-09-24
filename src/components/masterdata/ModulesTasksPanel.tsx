import { useState } from 'react';
import type { ModuleDto, ProjectDto, WorkTaskDto } from '../../api/types';
import { ModuleTaskTree, type ModuleTaskTreeMutations } from './ModuleTaskTree';
import controls from '../../styles/controls.module.css';
import pageStyles from '../../pages/MasterData.module.css';

interface ModulesTasksPanelProps {
  projects: ProjectDto[];
  modules: ModuleDto[];
  tasks: WorkTaskDto[];
  mutations: ModuleTaskTreeMutations;
}

/** The standalone "Modules & Task Types" tab: pick a project, then manage
 * its module/task tree via the shared ModuleTaskTree component (also used,
 * without the project picker, inside the guided "Set up project" flow —
 * see ProjectSetupFlow). Kept as its own tab for going back to adjust an
 * already-set-up project's modules/tasks later without re-running the whole
 * guided flow. */
export function ModulesTasksPanel({ projects, modules, tasks, mutations }: ModulesTasksPanelProps) {
  const [projectId, setProjectId] = useState<number | ''>('');

  const selectedProject = projectId === '' ? undefined : projects.find((p) => p.id === projectId);
  const projectModules = projectId === '' ? [] : modules.filter((m) => m.projectId === projectId);
  const projectModuleIds = new Set(projectModules.map((m) => m.id));
  const projectTasks = tasks.filter((t) => projectModuleIds.has(t.moduleId));

  // Suggestions drawn from every module/task in the system (not just this
  // project) — approved scope: a common name like "Development" should
  // autocomplete regardless of which customer/project it's being added to.
  const moduleNameSuggestions = Array.from(new Set(modules.map((m) => m.name))).sort((a, b) => a.localeCompare(b));
  const taskNameSuggestions = Array.from(new Set(tasks.map((t) => t.name))).sort((a, b) => a.localeCompare(b));

  return (
    <div className={pageStyles.card} style={{ padding: 16 }}>
      <div className={controls.field} style={{ maxWidth: 420 }}>
        <label>Project</label>
        <select
          className={controls.select}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
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
        <ModuleTaskTree
          projectId={projectId}
          modules={projectModules}
          tasks={projectTasks}
          mutations={mutations}
          moduleNameSuggestions={moduleNameSuggestions}
          taskNameSuggestions={taskNameSuggestions}
          embedded
        />
      )}
    </div>
  );
}
