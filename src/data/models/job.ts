import { z } from 'zod';

export const JOB_STATUSES = [
  'planning',
  'working',
  'submitted',
  'invoiced',
  'paid',
] as const;

export const jobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  planning: 'Planning',
  working: 'Working',
  submitted: 'Submitted',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

export const jobSchema = z.object({
  id: z.string(),
  jobNumber: z.number().int(),
  clientId: z.string().min(1, 'Choose a client'),
  project: z.string().optional(),
  description: z.string().optional(),
  /** Net fee stored in integer pence to avoid floating-point money errors. */
  feeNetPence: z.number().int().nonnegative(),
  /** VAT rate as a fraction, e.g. 0.20 for 20%. */
  vatRate: z.number().min(0).max(1),
  status: jobStatusSchema,
  /** ISO yyyy-MM-dd or null. */
  startDate: z.string().nullable(),
  /** ISO yyyy-MM-dd or null (null when ASAP or unscheduled). */
  returnDate: z.string().nullable(),
  /** True when the job is urgent with no fixed return date ("ASAP"). */
  isAsap: z.boolean(),
  estimatedDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
  /** Link to a generated invoice (Phase 2). */
  invoiceId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type Job = z.infer<typeof jobSchema>;

/**
 * Form values. Fee is captured in pounds (string from the input) and converted
 * to pence in the repository layer, so the form schema keeps fee as a number of
 * pence too — the page is responsible for the pounds<->pence conversion via lib/currency.
 */
export const jobFormSchema = jobSchema
  .omit({ id: true, jobNumber: true, createdAt: true, invoiceId: true })
  .extend({
    vatRate: z.number().min(0).max(1),
  });
export type JobFormValues = z.infer<typeof jobFormSchema>;
