import { useState } from 'react';
import { WEEK_DAY_SHORT } from '../../api/types';
import type {
  AssignEmployeesRequest, ClientWeekOffDto, EmployeeWeekOffDto, SaveClientWeekOffRequest,
  UpdateEmployeeWeekOffRequest, WeekOffOptionsDto,
} from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from '../timesheet/EntryDrawer.module.css';

// WEEK OFFS (Nov 2026): the three Week Offs drawers -
//   ClientWeekOffDrawer    add / edit a client's week-off days
//   AssignEmployeesDrawer  add employees to a client
//   EmployeeWeekOffDrawer  change one employee's dates

/** From / To date inputs, shared by all three drawers. */
function DateRange({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 10 }}>
        <div className={controls.field} style={{ flex: 1 }}>
          <label>From <span className={controls.req}>*</span></label>
          <input className={controls.textInput} type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
        </div>
        <div className={controls.field} style={{ flex: 1 }}>
          <label>To</label>
          <input className={controls.textInput} type="date" value={to} onChange={(e) => onTo(e.target.value)} />
        </div>
      </div>
      <div className={controls.hint} style={{ marginTop: -6, marginBottom: 12 }}>Leave To empty if there is no end date.</div>
    </>
  );
}

/** Checks From / To and returns an error message, or '' when fine. */
function dateError(from: string, to: string) {
  if (!from) return 'From date is required.';
  if (to && to < from) return "To date can't be before From date.";
  return '';
}

// ---- Client week off ----

interface ClientWeekOffDrawerProps {
  existing?: ClientWeekOffDto;
  options: WeekOffOptionsDto;
  onSave: (body: SaveClientWeekOffRequest) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function ClientWeekOffDrawer({ existing, options, onSave, onDelete, onCancel }: ClientWeekOffDrawerProps) {
  const [accountId, setAccountId] = useState(existing ? String(existing.accountId) : '');
  const [days, setDays] = useState<string[]>(existing?.weekOffDays ?? []);
  const [from, setFrom] = useState(existing?.effectiveFrom ?? '');
  const [to, setTo] = useState(existing?.effectiveTo ?? '');
  const [error, setError] = useState('');

  function toggleDay(day: string) {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
    setError('');
  }

  function handleSave() {
    if (!accountId) { setError('Pick a client.'); return; }
    if (days.length === 0) { setError('Pick at least one week off day.'); return; }
    const problem = dateError(from, to);
    if (problem) { setError(problem); return; }
    onSave({
      accountId: Number(accountId),
      // Keep Monday-first order, whatever order they were ticked in.
      weekOffDays: WEEK_DAY_SHORT.filter((d) => days.includes(d)),
      effectiveFrom: from,
      effectiveTo: to || null,
    });
  }

  return (
    <div>
      <div className={controls.field}>
        <label>Client <span className={controls.req}>*</span></label>
        {/* The client can't change on edit - add a new client week off instead. */}
        <select className={controls.select} value={accountId} disabled={Boolean(existing)} onChange={(e) => { setAccountId(e.target.value); setError(''); }}>
          <option value="">Select a client</option>
          {options.clients.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className={controls.field}>
        <label>Week off days <span className={controls.req}>*</span></label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WEEK_DAY_SHORT.map((day) => {
            const on = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={on}
                className={`${controls.btn} ${controls.sm} ${on ? controls.pri : ''}`}
                style={{ minWidth: 46 }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className={controls.hint}>The client's week-off days. Employees assigned to this client follow them.</div>
      </div>

      <DateRange from={from} to={to} onFrom={(v) => { setFrom(v); setError(''); }} onTo={(v) => { setTo(v); setError(''); }} />

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>{existing ? 'Save Changes' : 'Add Client Week Off'}</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        {existing && onDelete && (
          <>
            <div style={{ flex: 1 }} />
            <button className={`${controls.btn} ${controls.dgr}`} onClick={onDelete}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Assign employees ----

interface AssignEmployeesDrawerProps {
  client: ClientWeekOffDto;
  options: WeekOffOptionsDto;
  onSave: (body: AssignEmployeesRequest) => void;
  onCancel: () => void;
}

export function AssignEmployeesDrawer({ client, options, onSave, onCancel }: AssignEmployeesDrawerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(client.effectiveFrom);
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  // Employees already listed under this client aren't offered again.
  const alreadyAssigned = new Set(client.employees.map((e) => e.employeeCode));
  const searchText = search.trim().toLowerCase();
  const choices = options.employees.filter((o) =>
    !alreadyAssigned.has(o.value) && (!searchText || o.label.toLowerCase().includes(searchText)));

  function toggle(code: string) {
    setSelected((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
    setError('');
  }

  function handleSave() {
    if (selected.length === 0) { setError('Pick at least one employee.'); return; }
    const problem = dateError(from, to);
    if (problem) { setError(problem); return; }
    onSave({ accountId: client.accountId, employeeCodes: selected, effectiveFrom: from, effectiveTo: to || null });
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        <b>{client.clientName}</b> - week offs {client.weekOffDays.join(', ')}
      </div>

      <div className={controls.field}>
        <label>Employees <span className={controls.req}>*</span> {selected.length > 0 && <span style={{ fontWeight: 400 }}>({selected.length} selected)</span>}</label>
        <input
          className={controls.textInput}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          style={{ marginBottom: 6 }}
        />
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: 4, padding: '4px 8px' }}>
          {choices.length === 0 && <div style={{ color: 'var(--slate)', fontSize: 12, padding: 6 }}>No Record Found</div>}
          {choices.map((o) => (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <DateRange from={from} to={to} onFrom={(v) => { setFrom(v); setError(''); }} onTo={(v) => { setTo(v); setError(''); }} />

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>Add Employees</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ---- One employee's dates ----

interface EmployeeWeekOffDrawerProps {
  existing: EmployeeWeekOffDto;
  clientName: string;
  onSave: (body: UpdateEmployeeWeekOffRequest) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EmployeeWeekOffDrawer({ existing, clientName, onSave, onDelete, onCancel }: EmployeeWeekOffDrawerProps) {
  const [from, setFrom] = useState(existing.effectiveFrom);
  const [to, setTo] = useState(existing.effectiveTo ?? '');
  const [error, setError] = useState('');

  function handleSave() {
    const problem = dateError(from, to);
    if (problem) { setError(problem); return; }
    onSave({ effectiveFrom: from, effectiveTo: to || null });
  }

  return (
    <div>
      <div className={controls.hint} style={{ marginBottom: 12 }}>
        <b>{existing.employeeName}</b> ({existing.employeeCode}) - {clientName}
      </div>

      <DateRange from={from} to={to} onFrom={(v) => { setFrom(v); setError(''); }} onTo={(v) => { setTo(v); setError(''); }} />

      {error && <div className={styles.errMsg}>{error}</div>}

      <div className={styles.footer}>
        <button className={`${controls.btn} ${controls.pri}`} onClick={handleSave}>Save Changes</button>
        <button className={controls.btn} onClick={onCancel}>Cancel</button>
        <div style={{ flex: 1 }} />
        <button className={`${controls.btn} ${controls.dgr}`} onClick={onDelete}>Remove</button>
      </div>
    </div>
  );
}
