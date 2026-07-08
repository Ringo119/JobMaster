import type { Job } from '../data/models/job';
import type { Invoice } from '../data/models/invoice';
import type { Client } from '../data/models/client';
import { daysUntil, isOverdue, isDueWithin, formatUK } from './dates';
import { visualStatus } from './jobStatus';
import { isOutstanding } from './invoiceStatus';

export type ReminderSeverity = 'urgent' | 'warning' | 'info';

export interface Reminder {
  id: string;
  severity: ReminderSeverity;
  title: string;
  detail: string;
  /** In-app route to open when the reminder is clicked. */
  to: string;
  /** Sort key — smaller is more pressing. */
  order: number;
}

const SEVERITY_ORDER: Record<ReminderSeverity, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
};

/**
 * Derive the active reminders from the current jobs and invoices. Pure function
 * so it can be unit-tested and reused by both the bell and the dashboard.
 * - Jobs: ASAP, overdue, or due within 3 days (and not yet submitted/closed).
 * - Invoices: overdue (unpaid past due) or due within 7 days.
 */
export function buildReminders(
  jobs: Job[],
  invoices: Invoice[],
  clients: Client[],
): Reminder[] {
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const reminders: Reminder[] = [];

  for (const job of jobs) {
    const who = clientName.get(job.clientId) ?? 'Unknown client';
    const label = [who, job.project].filter(Boolean).join(' · ');
    const status = visualStatus(job);

    if (job.isAsap) {
      reminders.push({
        id: `job-asap-${job.id}`,
        severity: 'urgent',
        title: `ASAP: ${label}`,
        detail: 'Urgent job with no fixed return date.',
        to: `/jobs/${job.id}`,
        order: -1,
      });
    } else if (status === 'overdue') {
      const n = daysUntil(job.returnDate);
      reminders.push({
        id: `job-overdue-${job.id}`,
        severity: 'urgent',
        title: `Overdue: ${label}`,
        detail: `Return was due ${formatUK(job.returnDate)}${
          n !== null ? ` (${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} ago)` : ''
        }.`,
        to: `/jobs/${job.id}`,
        order: n ?? 0,
      });
    } else if (
      isDueWithin(job.returnDate, 3) &&
      job.status !== 'submitted' &&
      job.status !== 'invoiced' &&
      job.status !== 'paid'
    ) {
      const n = daysUntil(job.returnDate);
      reminders.push({
        id: `job-due-${job.id}`,
        severity: 'warning',
        title: `Due soon: ${label}`,
        detail: `Return due ${formatUK(job.returnDate)}${
          n === 0 ? ' (today)' : n === 1 ? ' (tomorrow)' : ''
        }.`,
        to: `/jobs/${job.id}`,
        order: (n ?? 0) + 1,
      });
    }
  }

  for (const invoice of invoices) {
    if (!isOutstanding(invoice) || !invoice.dueDate) continue;
    const who = clientName.get(invoice.clientId) ?? 'Unknown client';

    if (isOverdue(invoice.dueDate)) {
      reminders.push({
        id: `inv-overdue-${invoice.id}`,
        severity: 'urgent',
        title: `Invoice overdue: ${invoice.invoiceNumber}`,
        detail: `${who} — payment was due ${formatUK(invoice.dueDate)}.`,
        to: `/invoices/${invoice.id}`,
        order: -0.5,
      });
    } else if (isDueWithin(invoice.dueDate, 7)) {
      reminders.push({
        id: `inv-due-${invoice.id}`,
        severity: 'info',
        title: `Payment due soon: ${invoice.invoiceNumber}`,
        detail: `${who} — due ${formatUK(invoice.dueDate)}.`,
        to: `/invoices/${invoice.id}`,
        order: 5,
      });
    }
  }

  return reminders.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.order - b.order,
  );
}
