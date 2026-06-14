import { DexieClientRepository } from './dexie/clientRepo';
import { DexieJobRepository } from './dexie/jobRepo';
import { DexieInvoiceRepository } from './dexie/invoiceRepo';
import { DexieSettingsRepository } from './dexie/settingsRepo';

/**
 * The active repository set. This is the ONLY file to change when moving from
 * the local Dexie store (Phase 1) to a Supabase backend (Phase 2): swap these
 * constructions for the Supabase implementations.
 */
export const clientRepository = new DexieClientRepository();
export const jobRepository = new DexieJobRepository();
export const invoiceRepository = new DexieInvoiceRepository();
export const settingsRepository = new DexieSettingsRepository();
