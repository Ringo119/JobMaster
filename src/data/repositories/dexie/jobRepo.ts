import { db } from '../../db';
import { uuid } from '../../../lib/uuid';
import type { Job } from '../../models/job';
import type { JobFilter, JobRepository, NewJob } from '../types';
import { DexieSettingsRepository } from './settingsRepo';

const settingsRepo = new DexieSettingsRepository();

export class DexieJobRepository implements JobRepository {
  async list(filter?: JobFilter): Promise<Job[]> {
    let jobs = await db.jobs.toArray();

    if (filter?.status && filter.status !== 'all') {
      jobs = jobs.filter((j) => j.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      jobs = jobs.filter(
        (j) =>
          String(j.jobNumber).includes(q) ||
          (j.project ?? '').toLowerCase().includes(q) ||
          (j.description ?? '').toLowerCase().includes(q),
      );
    }
    return jobs.sort(byReturnDate);
  }

  async listByClient(clientId: string): Promise<Job[]> {
    const jobs = await db.jobs.where('clientId').equals(clientId).toArray();
    return jobs.sort(byReturnDate);
  }

  async get(id: string): Promise<Job | undefined> {
    return db.jobs.get(id);
  }

  async create(data: NewJob): Promise<Job> {
    const jobNumber = await settingsRepo.nextJobNumber();
    const job: Job = {
      ...data,
      id: uuid(),
      jobNumber,
      createdAt: new Date().toISOString(),
    };
    await db.jobs.add(job);
    return job;
  }

  async update(id: string, patch: Partial<Job>): Promise<Job> {
    await db.jobs.update(id, patch);
    const updated = await db.jobs.get(id);
    if (!updated) throw new Error(`Job ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.jobs.delete(id);
  }
}

/** ASAP jobs first, then by ascending return date, then unscheduled last. */
function byReturnDate(a: Job, b: Job): number {
  if (a.isAsap && !b.isAsap) return -1;
  if (b.isAsap && !a.isAsap) return 1;
  if (!a.returnDate && !b.returnDate) return a.jobNumber - b.jobNumber;
  if (!a.returnDate) return 1;
  if (!b.returnDate) return -1;
  return a.returnDate.localeCompare(b.returnDate);
}
