import { useState } from 'react';
import type { TimeEntryDto, DayTypeDto, CreateTimeEntryRequest, WeekHours } from '../../api/types';
import { DAY_NAMES } from '../../types/meridian';
import { useMasterDataLookup } from '../../hooks/api/useMasterDataLookup';
import controls from '../../styles/controls.module.css';
import styles from './EntryDrawer.module.css';

interface EntryDrawerProps {
  dayTypes: DayTypeDto[];
  existing?: TimeEntryDto;
  duplicateFrom?: TimeEntryDto;
  onSave: (data: CreateTimeEntryRequest) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const dayMonth = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export function EntryDrawer({ dayTypes, existing, duplicateFrom, onSave, onDelete, onCancel }: EntryDrawerProps) {
  const { departments, accounts, projects, modules, tasks, accById, projById, modById, taskById, projAccountId, projDeptId } =
    useMasterDataLookup();

  const source = existing ?? duplicateFrom;

  const [dept, setDept] = useState<number | ''>(source ? projDeptId(source.projectId) ?? '' : '');
  const [acc, setAcc] = useState<number | ''>(source ? projAccountId(source.projectId) ?? '' : '');
  const [proj, setProj] = useState<number | ''>(source?.projectId ?? '');
  const [mod, setMod] = useState<number | ''>(source?.moduleId ?? '');
  const [task, setTask] = useState<number | ''>(source?.taskId ?? '');
  const [classification, setClassification] = useState<'Billable' | 'NonBillable' | 'PartialBillable'>(
    source?.classification ?? 'Billable',
  );
  const [billingCategory, setBillingCategory] = useState<string | null>(source?.billingCategory ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [hours, setHours] = useState<number[]>(existing ? [...existing.hoursByDay] : [0, 0, 0, 0, 0, 0, 0]);
  const [showTaskError, setShowTaskError] = useState(false);
  const [showNoteError, setShowNoteError] = useState(false);

  const accountObj = acc !== '' ? accById(acc) : undefined;
  const projectObj = proj !== '' ? projById(proj) : undefined;
  const moduleObj = mod !== '' ? modById(mod) : undefined;
  const taskObj = task !== '' ? taskById(task) : undefined;

  const accountsForDept = dept !== '' ? accounts.filter((a) => a.departmentId === dept) : [];
  const projectsForAcc = acc !== '' ? projects.filter((p) => p.accountId === acc) : [];
  const modulesForProj = proj !== '' ? modules.filter((m) => m.projectId === proj) : [];
  const tasksForMod = mod !== '' ? tasks.filter((t) => t.moduleId === mod) : [];

  function updateClassification(next: 'Billable' | 'NonBillable' | 'PartialBillable') {
    setClassification(next);
    setBillingCategory(null);
  }

  function capacityClosed(i: number) {
    const t = dayTypes[i]?.dayType;
    return !(t === 'W' || t === 'WFH');
  }

  function handleSave() {
    if (task === '') {
      setShowTaskError(true);
      return;
    }
    if (note.trim() === '') {
      setShowNoteError(true);
      return;
    }
    onSave({
      projectId: proj as number,
      moduleId: mod as number,
      taskId: task as number,
      classification,
      billingCategory: classification === 'PartialBillable' ? null : billingCategory,
      note: note.trim() || null,
      hoursByDay: hours as WeekHours,
    });
  }

  return (
    <div>
      <div className={styles.chain}>
        {dept !== '' ? <b>{departments.find((d) => d.id === dept)?.name}</b> : <span className={styles.ph}>Department</span>}
        <i>›</i>
        {acc !== '' ? <b>{accountObj?.name}</b> : <span className={styles.ph}>Customer/Internal</span>}
        <i>›</i>
        {proj !== '' ? <b>{projectObj?.code}</b> : <span className={styles.ph}>Project</span>}
        <i>›</i>
        {mod !== '' ? <b>{moduleObj?.name}</b> : <span className={styles.ph}>Module</span>}
        <i>›</i>
        {task !== '' ? <b>{taskObj?.name}</b> : <span className={styles.ph}>Task</span>}
      </div>

      <div className={controls.field}>
        <label>Department <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={dept}
          onChange={(e) => {
            setDept(e.target.value ? Number(e.target.value) : '');
            setAcc(''); setProj(''); setMod(''); setTask('');
          }}
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className={controls.field}>
        <label>Customer / Internal <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={acc}
          disabled={dept === ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : '';
            setAcc(id); setProj(''); setMod(''); setTask('');
            if (id !== '') {
              const a = accById(id);
              if (a) updateClassification(a.accountType !== 'Internal' ? 'Billable' : 'NonBillable');
            }
          }}
        >
          <option value="">{dept !== '' ? 'Select customer or internal' : 'Select a department first'}</option>
          {accountsForDept.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {acc !== '' && accountObj && (
          <div className={controls.hint}>
            {accountObj.accountType} account — default classification is {accountObj.accountType === 'Internal' ? 'non-billable' : 'billable'}
          </div>
        )}
      </div>

      <div className={controls.field}>
        <label>Project <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={proj}
          disabled={acc === ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : '';
            setProj(id); setMod(''); setTask('');
            if (id !== '') {
              const p = projById(id);
              if (p) updateClassification(p.defaultBillable ? 'Billable' : 'NonBillable');
            }
          }}
        >
          <option value="">{acc !== '' ? 'Select project' : 'Select a customer first'}</option>
          {projectsForAcc.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className={controls.field}>
        <label>Module <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={mod}
          disabled={proj === ''}
          onChange={(e) => {
            setMod(e.target.value ? Number(e.target.value) : '');
            setTask('');
          }}
        >
          <option value="">{proj !== '' ? 'Select module' : 'Select a project first'}</option>
          {modulesForProj.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className={controls.field}>
        <label>Task <span className={controls.req}>*</span></label>
        <select
          className={controls.select}
          value={task}
          disabled={mod === ''}
          onChange={(e) => {
            setTask(e.target.value ? Number(e.target.value) : '');
            setShowTaskError(false);
          }}
        >
          <option value="">{mod !== '' ? 'Select task' : 'Select a module first'}</option>
          {tasksForMod.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {showTaskError && <div className={styles.errMsg}>Select the task this effort belongs to.</div>}
      </div>

      <div className={controls.field}>
        <label>Classification</label>
        <div className={styles.segBill}>
          <button className={classification === 'Billable' ? styles.on : ''} onClick={() => updateClassification('Billable')}>Billable</button>
          <button className={classification === 'NonBillable' ? styles.on : ''} onClick={() => updateClassification('NonBillable')}>Non-billable</button>
          <button className={classification === 'PartialBillable' ? styles.on : ''} onClick={() => updateClassification('PartialBillable')}>Partial Billable</button>
        </div>
        {classification !== 'PartialBillable' && (
          <div className={styles.segCat}>
            {(classification === 'Billable' ? ['AMS', 'T&M', 'FB'] : ['OH']).map((opt) => (
              <button
                key={opt}
                className={billingCategory === opt ? styles.on : ''}
                onClick={() => setBillingCategory((cur) => (cur === opt ? null : opt))}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {proj !== '' && projectObj && (
          <div className={controls.hint}>
            Project default is {projectObj.defaultBillable ? 'billable' : 'non-billable'} — you can override it for this line.
          </div>
        )}
      </div>

      <div className={controls.field}>
        <label>Hours by day</label>
        <div className={styles.dayPick}>
          {dayTypes.map((dt, i) => {
            const closed = capacityClosed(i);
            return (
              <label key={dt.date} className={closed ? styles.off : ''} title={dayMonth(dt.date)}>
                <span>{DAY_NAMES[i].slice(0, 2)}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  readOnly={closed}
                  value={hours[i] || ''}
                  placeholder="·"
                  onChange={(e) => {
                    let v = parseFloat(e.target.value);
                    if (Number.isNaN(v) || v < 0) v = 0;
                    v = Math.min(4, v);
                    setHours((h) => h.map((x, idx) => (idx === i ? v : x)));
                  }}
                />
              </label>
            );
          })}
        </div>
        <div className={controls.hint}>Maximum 4 hours per day for a single task line. Days marked leave, holiday or weekly off are closed for entry.</div>
      </div>

      <div className={controls.field}>
        <label>What did you work on? <span className={controls.req}>*</span></label>
        <textarea
          className={controls.textarea}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setShowNoteError(false);
          }}
          placeholder="Be specific — this is what your lead reads when approving."
        />
        {showNoteError && <div className={styles.errMsg}>Add a description of what you worked on.</div>}
        <div className={controls.hint}>Required for every line.</div>
      </div>

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>
          {existing ? 'Save changes' : 'Add line'}
        </button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        {existing && onDelete && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={onDelete}>Remove line</button>
          </>
        )}
      </div>
    </div>
  );
}
