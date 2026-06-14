import type { Job, JobStatus } from '../data/models/job';
import { isOverdue } from './dates';

/** A visual status that includes the derived "overdue" state for colour coding. */
export type VisualStatus = JobStatus | 'overdue';

/**
 * Derive the colour-coding status for a job. A job is shown as overdue when its
 * return date has passed and it has not yet been submitted/invoiced/paid.
 */
export function visualStatus(job: Job): VisualStatus {
  const done = job.status === 'submitted' || job.status === 'invoiced' || job.status === 'paid';
  if (!done && (job.isAsap || isOverdue(job.returnDate))) return 'overdue';
  return job.status;
}

/** Tailwind classes for badges/bars, matching the planner legend in the spec. */
export const STATUS_STYLES: Record<VisualStatus, { bar: string; badge: string; label: string }> = {
  planning: { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800', label: 'Planning' },
  working: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', label: 'Working' },
  submitted: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800', label: 'Submitted' },
  invoiced: { bar: 'bg-slate-400', badge: 'bg-slate-200 text-slate-700', label: 'Invoiced' },
  paid: { bar: 'bg-slate-400', badge: 'bg-slate-200 text-slate-700', label: 'Paid' },
  overdue: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-800', label: 'Overdue' },
};
