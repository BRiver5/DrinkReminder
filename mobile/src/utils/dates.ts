const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local-time ISO string without timezone suffix: "YYYY-MM-DDTHH:mm:ss" */
export function toLocalISO(d: Date): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
}

/** "YYYY-MM-DD" for a Date in local time */
export function dayKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return dayKeyFromDate(new Date());
}

export function dateFromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToKey(key: string, days: number): string {
  const d = dateFromDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKeyFromDate(d);
}

/** N day keys in ascending order, ending today */
export function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    keys.push(dayKeyFromDate(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

/** "Monday, 7 Jul" */
export function formatHeaderDate(d: Date = new Date()): string {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Mon, 7 Jul" style label for a day key */
export function formatDayLabel(key: string): string {
  const d = dateFromDayKey(key);
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Mo" for chart x-axis */
export function weekdayShort(key: string): string {
  return WEEKDAYS_SHORT[dateFromDayKey(key).getDay()];
}

/** Day of month as string, e.g. "7" */
export function dayOfMonth(key: string): string {
  return String(dateFromDayKey(key).getDate());
}

/** "14:05" from a local ISO datetime */
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

/** Parse "HH:MM" -> { hour, minute } */
export function parseHHMM(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

export function hhmmFromDate(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function dateFromHHMM(time: string): Date {
  const { hour, minute } = parseHHMM(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
