import { z } from 'zod';

/** Kanban columns for a job's board — every task lives in exactly one. */
export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;

export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
};

/**
 * A sub-task within a job ("First Fix Electrical", "Pricing & submission"…).
 * Tasks power the expandable rows on the Planner and the per-job kanban board:
 * when a task has its own dates it renders as a bar under the job; undated
 * tasks still count towards the job's progress chip and appear on the board.
 */
export const jobTaskSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  title: z.string().min(1, 'Task needs a title'),
  /** Board column. Replaces the old boolean `done` (migrated in db v4). */
  status: taskStatusSchema,
  /** ISO yyyy-MM-dd or null. Both set → the task gets its own planner bar. */
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  /** Manual ordering within the job (ascending). */
  sortOrder: z.number().int(),
  createdAt: z.string(),
});

export type JobTask = z.infer<typeof jobTaskSchema>;

/** Convenience for progress chips / strike-through styling. */
export function isTaskDone(task: Pick<JobTask, 'status'>): boolean {
  return task.status === 'done';
}
