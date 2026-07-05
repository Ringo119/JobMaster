import { addDays, parseISO } from 'date-fns';
import { db } from '../../db';
import { uuid } from '../../../lib/uuid';
import { toISODate } from '../../../lib/dates';
import type { JobTask } from '../../models/task';
import type { NewTask, TaskRepository } from '../types';

export class DexieTaskRepository implements TaskRepository {
  async list(): Promise<JobTask[]> {
    const tasks = await db.tasks.toArray();
    return tasks.sort(byStart);
  }

  async listByJob(jobId: string): Promise<JobTask[]> {
    const tasks = await db.tasks.where('jobId').equals(jobId).toArray();
    return tasks.sort(byStart);
  }

  async create(data: NewTask): Promise<JobTask> {
    const task: JobTask = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.tasks.add(task);
    return task;
  }

  async update(id: string, patch: Partial<JobTask>): Promise<JobTask> {
    await db.tasks.update(id, patch);
    const updated = await db.tasks.get(id);
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.tasks.delete(id);
  }

  async shiftByJob(jobId: string, deltaDays: number): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      const tasks = await db.tasks.where('jobId').equals(jobId).toArray();
      for (const task of tasks) {
        await db.tasks.update(task.id, {
          startDate: toISODate(addDays(parseISO(task.startDate), deltaDays)),
        });
      }
    });
  }
}

/** Earliest start first, then stable by creation time. */
function byStart(a: JobTask, b: JobTask): number {
  return (
    a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
  );
}
