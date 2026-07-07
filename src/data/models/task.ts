import { z } from 'zod';

/**
 * A sub-task within a job ("First Fix Electrical", "Pricing & submission"…).
 * Tasks power the expandable rows on the Planner: when a task has its own
 * dates it renders as a bar under the job; undated tasks still count towards
 * the job's done/total progress chip.
 */
export const jobTaskSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  title: z.string().min(1, 'Task needs a title'),
  done: z.boolean(),
  /** ISO yyyy-MM-dd or null. Both set → the task gets its own planner bar. */
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  /** Manual ordering within the job (ascending). */
  sortOrder: z.number().int(),
  createdAt: z.string(),
});

export type JobTask = z.infer<typeof jobTaskSchema>;
