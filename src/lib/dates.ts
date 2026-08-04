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

export function dayOfWeek(s: string): number {
  return parseISO(s).getUTCDay(); // 0 = Sunday, 6 = Saturday
}
