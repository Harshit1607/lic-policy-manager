/**
 * Date utilities that operate on calendar dates represented as ISO
 * `YYYY-MM-DD` strings. All premium scheduling is day-precise and must be
 * independent of device timezone, so we never rely on Date time components.
 */

export type ISODate = string; // 'YYYY-MM-DD'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && ISO_DATE_RE.test(value);
}

/** Parse 'YYYY-MM-DD' into its numeric parts. Throws on malformed input. */
export function parseISODate(value: ISODate): { year: number; month: number; day: number } {
  if (!isISODate(value)) {
    throw new Error(`Invalid ISO date: ${String(value)}`);
  }
  const [year, month, day] = value.split('-').map((p) => parseInt(p, 10));
  return { year, month, day };
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function toISODate(year: number, month: number, day: number): ISODate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Convert an ISO date into a UTC-anchored Date (midnight) for arithmetic. */
export function isoToUTC(value: ISODate): Date {
  const { year, month, day } = parseISODate(value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcToISO(date: Date): ISODate {
  return toISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Today's date (device local calendar day) as an ISO date string. */
export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Number of days in a given month (1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Add a number of whole months to an ISO date. When the resulting month has
 * fewer days than the source day, the day is clamped to the month end
 * (e.g. 2024-01-31 + 1 month = 2024-02-29). This matches how LIC anniversary
 * due dates fall on month ends.
 */
export function addMonths(value: ISODate, months: number): ISODate {
  const { year, month, day } = parseISODate(value);
  const zeroBased = month - 1 + months;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12; // 0-11
  const clampDay = Math.min(day, daysInMonth(newYear, newMonth + 1));
  return toISODate(newYear, newMonth + 1, clampDay);
}

export function addYears(value: ISODate, years: number): ISODate {
  return addMonths(value, years * 12);
}

export function addDays(value: ISODate, days: number): ISODate {
  const utc = isoToUTC(value);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utcToISO(utc);
}

/** a - b in whole days (positive when a is after b). */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = isoToUTC(a).getTime() - isoToUTC(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** Negative if a<b, 0 if equal, positive if a>b. */
export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return compareISO(a, b) <= 0 ? a : b;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return compareISO(a, b) >= 0 ? a : b;
}
