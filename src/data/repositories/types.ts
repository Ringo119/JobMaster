import type { Client } from '../models/client';
import type { Job, JobStatus } from '../models/job';
import type { Invoice } from '../models/invoice';
import type { Settings } from '../models/settings';
import type { JobDocument } from '../models/document';

/**
 * Repository interfaces — the seam between the UI and persistence.
 *
 * The UI depends ONLY on these interfaces (via the hooks in src/hooks). They
 * are currently implemented against Dexie/IndexedDB. To move to Supabase later,
 * provide new implementations and re-point src/data/repositories/index.ts;
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
  getByJob(jobId: string): Promise<Invoice | undefined>;
  /**
   * Generate an invoice from a job: computes net/VAT/gross from the job's fee,
   * reserves an invoice number, sets a due date from the client's payment terms,
   * links the invoice to the job and advances the job's status to "invoiced".
   * Throws if the job already has an invoice.
   */
  createFromJob(jobId: string): Promise<Invoice>;
  /** Mark a draft invoice as sent to the client. */
  markSent(id: string): Promise<Invoice>;
  /** Mark an invoice as paid; also advances the linked job's status to "paid". */
  markPaid(id: string): Promise<Invoice>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(patch: Partial<Settings>): Promise<Settings>;
}

export interface DocumentRepository {
  listByJob(jobId: string): Promise<JobDocument[]>;
  create(data: Omit<JobDocument, 'id' | 'createdAt'>): Promise<JobDocument>;
  remove(id: string): Promise<void>;
}
