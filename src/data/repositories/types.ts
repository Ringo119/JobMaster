import type { Client } from '../models/client';
import type { Job, JobStatus } from '../models/job';
import type { Invoice } from '../models/invoice';
import type { Settings } from '../models/settings';

/**
 * Repository interfaces — the seam between the UI and persistence.
 *
 * The UI depends ONLY on these interfaces (via the hooks in src/hooks). In
 * Phase 1 they are implemented against Dexie/IndexedDB. To move to Supabase in
 * Phase 2, provide new implementations and re-point src/data/repositories/index.ts;
 * no screen or component needs to change.
 */

export interface JobFilter {
  search?: string;
  status?: JobStatus | 'all';
}

/** Data needed to create a job; jobNumber/id/createdAt are assigned by the repo. */
export type NewJob = Omit<Job, 'id' | 'jobNumber' | 'createdAt'>;

export interface ClientRepository {
  list(search?: string): Promise<Client[]>;
  get(id: string): Promise<Client | undefined>;
  create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  update(id: string, patch: Partial<Client>): Promise<Client>;
  remove(id: string): Promise<void>;
}

export interface JobRepository {
  list(filter?: JobFilter): Promise<Job[]>;
  listByClient(clientId: string): Promise<Job[]>;
  get(id: string): Promise<Job | undefined>;
  create(data: NewJob): Promise<Job>;
  update(id: string, patch: Partial<Job>): Promise<Job>;
  remove(id: string): Promise<void>;
}

export interface InvoiceRepository {
  list(): Promise<Invoice[]>;
  listByClient(clientId: string): Promise<Invoice[]>;
  get(id: string): Promise<Invoice | undefined>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(patch: Partial<Settings>): Promise<Settings>;
}
