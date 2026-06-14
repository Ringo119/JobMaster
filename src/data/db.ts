import Dexie, { type Table } from 'dexie';
import type { Client } from './models/client';
import type { Job } from './models/job';
import type { Invoice } from './models/invoice';
import type { Settings } from './models/settings';

/**
 * Local IndexedDB database (via Dexie). This is the Phase 1 persistence layer.
 * It is intentionally hidden behind the repository interfaces in
 * ./repositories so that Phase 2 can swap to Supabase without touching the UI.
 */
export class TenderTrackDB extends Dexie {
  clients!: Table<Client, string>;
  jobs!: Table<Job, string>;
  invoices!: Table<Invoice, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('tendertrack');
    this.version(1).stores({
      // Indexes chosen to support the Job Register (filter by status, sort by
      // return date, lookups by client) and Clients screens.
      clients: 'id, name',
      jobs: 'id, jobNumber, clientId, status, returnDate, isAsap',
      invoices: 'id, invoiceNumber, jobId, clientId, status',
      settings: 'id',
    });
  }
}

export const db = new TenderTrackDB();
