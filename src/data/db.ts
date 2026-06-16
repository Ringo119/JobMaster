import Dexie, { type Table } from 'dexie';
import type { Client } from './models/client';
import type { Job } from './models/job';
import type { Invoice } from './models/invoice';
import type { Settings } from './models/settings';
import type { JobDocument } from './models/document';

/**
 * Local IndexedDB database (via Dexie). This is the local persistence layer.
 * It is intentionally hidden behind the repository interfaces in
 * ./repositories so that a future backend can be swapped in without touching the UI.
 */
export class JobMasterDB extends Dexie {
  clients!: Table<Client, string>;
  jobs!: Table<Job, string>;
  invoices!: Table<Invoice, string>;
  settings!: Table<Settings, string>;
  documents!: Table<JobDocument, string>;

  constructor() {
    super('jobmaster');
    this.version(1).stores({
      // Indexes chosen to support the Job Register (filter by status, sort by
      // return date, lookups by client) and Clients screens.
      clients: 'id, name',
      jobs: 'id, jobNumber, clientId, status, returnDate, isAsap',
      invoices: 'id, invoiceNumber, jobId, clientId, status',
      settings: 'id',
    });
    // v2: per-job document attachments (added in v3.0).
    this.version(2).stores({
      documents: 'id, jobId, createdAt',
    });
  }
}

export const db = new JobMasterDB();
