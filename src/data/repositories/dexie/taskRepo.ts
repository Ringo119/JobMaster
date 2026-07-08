import { db } from '../../db';
import { uuid } from '../../../lib/uuid';
import type { JobTask } from '../../models/task';
import type { NewTask, TaskRepository } from '../types';

export class DexieTaskRepository implements TaskRepository {
  async listAll(): Promise<JobTask[]> {
    const tasks = await db.tasks.toArray();
    return tasks.sort(bySortOrder);
  }

  async listByJob(jobId: string): Promise<JobTask[]> {
    const tasks = await db.tasks.where('jobId').equals(jobId).toArray();
    return tasks.sort(bySortOrder);
  }

  async create(data: NewTask): Promise<JobTask> {
    let sortOrder = data.sortOrder;
    if (sortOrder == null) {
      const siblings = await db.tasks.where('jobId').equals(data.jobId).toArray();
      sortOrder = siblings.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1;
    }
    const task: JobTask = {
      ...data,
      sortOrder,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.tasks.add(task);
    if (task.status === 'doing') await nudgeJobToWorking(task.jobId);
    return task;
  }

  async update(id: string, patch: Partial<JobTask>): Promise<JobTask> {
    await db.tasks.update(id, patch);
    const updated = await db.tasks.get(id);
    if (!updated) throw new Error(`Task ${id} not found`);
    if (patch.status === 'doing') await nudgeJobToWorking(updated.jobId);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.tasks.delete(id);
  }
}

/**
 * Status automation: work starting on a task means work has started on the
 * job, so a Planning job advances to Working (mirroring the invoice-created →
 * Invoiced automation). Never moves a job backwards.
 */
async function nudgeJobToWorking(jobId: string): Promise<void> {
  const job = await db.jobs.get(jobId);
  if (job && job.status === 'planning') {
    await db.jobs.update(jobId, { status: 'working' });
  }
}

function bySortOrder(a: JobTask, b: JobTask): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.createdAt.localeCompare(b.createdAt);
}
