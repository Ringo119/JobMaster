import { addWeeks, endOfWeek, isWithinInterval, parseISO, startOfWeek, subDays } from 'date-fns';
import type { Job } from '../data/models/job';
import type { Invoice } from '../data/models/invoice';
import { isOutstanding, visualInvoiceStatus } from './invoiceStatus';
import { today } from './dates';

/**
 * Week-over-week stats for the tile row. Only genuinely derivable deltas are
 * reported as percentages (we have no status-change history): scheduled and
 * completed compare this week's return dates against last week's. Active jobs
 * and outstanding money get factual subtexts instead of invented trends.
 */

export interface WeekDelta {
  /** Percent change vs last week, or null when last week was zero. */
  pct: number | null;
  lastWeekCount: number;
}

export interface TileStats {
  activeCount: number;
  newThisWeekCount: number;
  scheduledThisWeek: { count: number; delta: WeekDelta };
  completedThisWeek: { count: number; delta: WeekDelta };
  outstandingPence: number;
  overdueInvoiceCount: number;
}

const WEEK_OPTS = { weekStartsOn: 1 as const };

function inWeek(iso: string | null | undefined, weekAnchor: Date): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  return isWithinInterval(d, {
    start: startOfWeek(weekAnchor, WEEK_OPTS),
    end: endOfWeek(weekAnchor, WEEK_OPTS),
  });
}

function weekDelta(current: number, lastWeek: number): WeekDelta {
  if (lastWeek === 0) return { pct: null, lastWeekCount: lastWeek };
  return {
    pct: Math.round(((current - lastWeek) / lastWeek) * 100),
    lastWeekCount: lastWeek,
  };
}

function isDone(job: Job): boolean {
  return job.status === 'submitted' || job.status === 'invoiced' || job.status === 'paid';
}

export function computeTileStats(jobs: Job[], invoices: Invoice[], now = today()): TileStats {
  const lastWeek = addWeeks(now, -1);

  const activeCount = jobs.filter((j) => j.status !== 'paid').length;
  const newThisWeekCount = jobs.filter(
    (j) => parseISO(j.createdAt) >= subDays(now, 7),
  ).length;

  const scheduledNow = jobs.filter((j) => inWeek(j.returnDate, now)).length;
  const scheduledPrev = jobs.filter((j) => inWeek(j.returnDate, lastWeek)).length;

  const completedNow = jobs.filter((j) => isDone(j) && inWeek(j.returnDate, now)).length;
  const completedPrev = jobs.filter((j) => isDone(j) && inWeek(j.returnDate, lastWeek)).length;

  const outstandingPence = invoices
    .filter(isOutstanding)
    .reduce((sum, inv) => sum + inv.grossTotalPence, 0);
  const overdueInvoiceCount = invoices.filter(
    (inv) => visualInvoiceStatus(inv) === 'overdue',
  ).length;

  return {
    activeCount,
    newThisWeekCount,
    scheduledThisWeek: { count: scheduledNow, delta: weekDelta(scheduledNow, scheduledPrev) },
    completedThisWeek: { count: completedNow, delta: weekDelta(completedNow, completedPrev) },
    outstandingPence,
    overdueInvoiceCount,
  };
}
