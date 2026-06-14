import { z } from 'zod';

// Invoices are modelled now so the data layer is ready, but the generator UI
// is Phase 2. Kept minimal and self-contained.
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'] as const;
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  jobId: z.string(),
  clientId: z.string(),
  dateIssued: z.string(),
  netTotalPence: z.number().int().nonnegative(),
  vatTotalPence: z.number().int().nonnegative(),
  grossTotalPence: z.number().int().nonnegative(),
  status: invoiceStatusSchema,
  dueDate: z.string().optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
