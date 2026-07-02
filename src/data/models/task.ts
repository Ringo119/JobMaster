import { z } from 'zod';

/**
 * A sub-task within a job — used to break a job down into smaller planned
 * steps on the Programme Planner (e.g. "Take-off", "Pricing", "Write-up").
 * Tasks are placed by start date + duration and ticked off when done.
 */
export const jobTaskSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  name: z.string().min(1, 'Task name is required'),
  /** ISO yyyy-MM-dd. Tasks always sit on the planner, so a date is required. */
  startDate: z.string(),
  /** Length of the task bar in whole days (minimum 1). */
  durationDays: z.number().int().positive(),
  done: z.boolean(),
  createdAt: z.string(),
});

export type JobTask = z.infer<typeof jobTaskSchema>;
