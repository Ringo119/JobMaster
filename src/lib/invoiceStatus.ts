import type { Invoice } from '../data/models/invoice';
import { isOverdue } from './dates';

/**
 * Visual status for an invoice, including the derived "overdue" state used for
 * the traffic-light colours in the register and payments screens. An invoice is
 * overdue when it is unpaid and its due date has passed.
 */
export type VisualInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export function visualInvoiceStatus(invoice: Invoice): VisualInvoiceStatus {
  if (invoice.status === 'paid') return 'paid';
  if (isOverdue(invoice.dueDate)) return 'overdue';
  return invoice.status === 'sent' ? 'sent' : 'draft';
}

/** Traffic-light styles matching the spec: 🟢 Paid, 🟠 Sent, 🔴 Overdue. */
export const INVOICE_STATUS_STYLES: Record<
  VisualInvoiceStatus,
  { dot: string; badge: string; label: string }
> = {
  draft: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600', label: 'Draft' },
  sent: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'Sent' },
  paid: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800', label: 'Paid' },
  overdue: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800', label: 'Overdue' },
};

/** An invoice counts as outstanding (awaiting payment) until it is paid. */
export function isOutstanding(invoice: Invoice): boolean {
  return invoice.status !== 'paid';
}
