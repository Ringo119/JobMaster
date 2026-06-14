import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';

/** "Today" anchor. Centralised so the demo/seed dates line up with the UI. */
export function today(): Date {
  return startOfDay(new Date());
}

/** Format an ISO yyyy-MM-dd string as UK "dd/MM/yyyy". Returns '' for null. */
export function formatUK(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd/MM/yyyy') : '';
}

/** Short UK format e.g. "12 Jun". */
export function formatShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'd MMM') : '';
}

/** Whole days from today until the given ISO date (negative = in the past). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = parseISO(iso);
  if (!isValid(d)) return null;
  return differenceInCalendarDays(startOfDay(d), today());
}

/** True when a job's return date has passed (and it is not yet completed). */
export function isOverdue(iso: string | null | undefined): boolean {
  const n = daysUntil(iso);
  return n !== null && n < 0;
}

/** True when the return date falls within the next `days` days (inclusive). */
export function isDueWithin(iso: string | null | undefined, days: number): boolean {
  const n = daysUntil(iso);
  return n !== null && n >= 0 && n <= days;
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}
