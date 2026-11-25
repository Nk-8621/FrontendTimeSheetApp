const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function mondayOf(s: string): string {
  const d = parseISO(s);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(s, -dow);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function dayMonth(s: string): string {
  const d = parseISO(s);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
}

export function weekLabel(weekStart: string): string {
  return `${dayMonth(weekStart)} – ${dayMonth(addDays(weekStart, 6))}, ${parseISO(weekStart).getUTCFullYear()}`;
}

/** Today's date (YYYY-MM-DD) on the user's own clock, not UTC. */
export function todayLocalISO(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** True when date (YYYY-MM-DD) is between start and end, both included. */
export function isWithin(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** True when the ranges [aStart, aEnd] and [bStart, bEnd] share at least one day. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** "12 Nov - 10 Dec" style label for a date range. */
export function rangeLabel(start: string, end: string): string {
  return `${dayMonth(start)} – ${dayMonth(end)}`;
}

export function dayOfWeek(s: string): number {
  return parseISO(s).getUTCDay(); // 0 = Sunday, 6 = Saturday
}
