import { useState } from 'react';
import type { AccountDto, HolidayDto } from '../../api/types';
import controls from '../../styles/controls.module.css';
import styles from './HolidayCalendarPanel.module.css';
import { EditButton } from '../ui/EditButton';

// HOLIDAY CALENDAR (Nov 2026): Master Data -> Holiday calendar tab.
// One year at a time, grouped by month. Opens on the current year and on
// Carbynetech (company-wide) holidays; a client can be picked instead.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COMPANY = 'company'; // filter value for Carbynetech (holidays with no client)

type When = 'all' | 'upcoming' | 'past';

/** "2026-12-25" -> its parts, read as a plain date (no time zone shifts). */
function readDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month: month - 1, day, weekday, key: value.slice(0, 10) };
}

/** Today as "YYYY-MM-DD" in the user's own time zone. */
function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}


interface HolidayCalendarPanelProps {
  holidays: HolidayDto[];
  accounts: AccountDto[];
  onAdd: () => void;
  onEdit: (holiday: HolidayDto) => void;
}

export function HolidayCalendarPanel({ holidays, accounts, onAdd, onEdit }: HolidayCalendarPanelProps) {
  const today = todayKey();
  const [year, setYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<string>(COMPANY);
  const [when, setWhen] = useState<When>('all');

  const clientName = (id: number) => accounts.find((a) => a.id === id)?.name ?? 'Client';
  // Carbynetech's own holidays: no client, or an Internal account (e.g. the
  // "Carbynetech" internal account). Everything else is a client holiday.
  const internalIds = new Set(accounts.filter((a) => a.accountType === 'Internal').map((a) => a.id));
  const isCompanyHoliday = (h: HolidayDto) => h.accountId === null || internalIds.has(h.accountId);
  // Every client is offered in the filter, with or without holidays.
  const clients = accounts
    .filter((a) => a.accountType === 'Customer')
    .sort((a, b) => a.name.localeCompare(b.name));
  const isCompany = filter === COMPANY;
  // A client with no holidays saved at all (any year).
  const clientHasNoHolidays = !isCompany && !holidays.some((h) => h.accountId === Number(filter));

  // This year's holidays, oldest first.
  const yearHolidays = holidays
    .filter((h) => readDate(h.date).year === year)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Holidays for the picked Carbynetech / client.
  const forFilter = yearHolidays.filter((h) => (isCompany ? isCompanyHoliday(h) : h.accountId === Number(filter)));
  const nextHoliday = forFilter.find((h) => readDate(h.date).key >= today);

  // Then All / Upcoming / Past.
  const shown = forFilter.filter((h) => {
    const key = readDate(h.date).key;
    if (when === 'upcoming') return key >= today;
    if (when === 'past') return key < today;
    return true;
  });

  // Group by month: [[monthIndex, holidays], ...]
  const byMonth: [number, HolidayDto[]][] = [];
  for (const h of shown) {
    const month = readDate(h.date).month;
    const last = byMonth[byMonth.length - 1];
    if (last && last[0] === month) last[1].push(h);
    else byMonth.push([month, [h]]);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.year}>
          <button type="button" onClick={() => setYear(year - 1)} aria-label="Previous year">‹</button>
          <span>{year}</span>
          <button type="button" onClick={() => setYear(year + 1)} aria-label="Next year">›</button>
        </div>
        <select className={`${controls.select} ${styles.filter}`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Show holidays for">
          <option value={COMPANY}>Carbynetech</option>
          {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <div className={styles.seg}>
          {(['all', 'upcoming', 'past'] as When[]).map((w) => (
            <button key={w} type="button" className={when === w ? styles.on : ''} onClick={() => setWhen(w)}>
              {w === 'all' ? 'All' : w === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>
        <button className={`${controls.btn} ${controls.pri} ${controls.sm} ${styles.add}`} onClick={onAdd}>New Record</button>
      </div>

      {forFilter.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>{clientHasNoHolidays ? 'No Records Found' : 'No data found'}</div>
      ) : (
        <>
          <div className={styles.card}>
            {byMonth.length === 0 && <div className={styles.empty}>No data found</div>}
            {byMonth.map(([month, list]) => (
              <div key={month} className={styles.month}>
                <div className={styles.monthName}>
                  {MONTHS[month].toUpperCase()}
                  <small>{list.length} holiday{list.length !== 1 ? 's' : ''}</small>
                </div>
                <div className={styles.rows}>
                  {list.map((h) => {
                    const d = readDate(h.date);
                    const isPast = d.key < today;
                    const isNext = nextHoliday?.holidayId === h.holidayId;
                    return (
                      <div key={h.holidayId} className={`${styles.row} ${isPast ? styles.past : ''}`}>
                        <div className={`${styles.tile} ${isPast ? styles.tilePast : ''}`}>
                          <i>{DAYS[d.weekday].slice(0, 3).toUpperCase()}</i>
                          <b>{String(d.day).padStart(2, '0')}</b>
                        </div>
                        <div className={styles.name}>
                          {h.name}
                          {isNext && <span className={styles.nextTag}>NEXT</span>}
                          <small>{DAYS[d.weekday]}</small>
                        </div>
                        <span className={styles.location}>{h.location}</span>
                        <span className={styles.chipCell}>
                          <span className={`${styles.chip} ${isCompanyHoliday(h) ? '' : styles.chipClient}`}>
                            {isCompanyHoliday(h) ? 'Carbynetech' : clientName(h.accountId!)}
                          </span>
                        </span>
                        <EditButton size="sm" label={`Edit holiday ${h.name}`} onClick={() => onEdit(h)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
