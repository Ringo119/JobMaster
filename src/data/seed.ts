import { db } from './db';
import { uuid } from '../lib/uuid';
import { defaultSettings } from './models/settings';
import type { Client } from './models/client';
import type { Job } from './models/job';

/**
 * Seed the local database with demo data drawn from David's real spreadsheet
 * (Gillespie, Taylor & Sons, Monument, A1 Construction). Runs once on first
 * load so every screen is populated. Dates are anchored around June 2026 to
 * match the source spreadsheet's timeline.
 */

function uid(): string {
  return uuid();
}

export async function seedDemoData(): Promise<void> {
  const now = new Date().toISOString();

  const gillespie: Client = {
    id: uid(),
    name: 'Gillespie',
    contact: 'J. Gillespie',
    email: 'enquiries@gillespie.example',
    phone: '01642 000111',
    address: 'Yarm Road, Stockton-on-Tees',
    paymentTermsDays: 30,
    createdAt: now,
  };
  const taylor: Client = {
    id: uid(),
    name: 'Taylor & Sons',
    contact: 'R. Taylor',
    email: 'office@taylorandsons.example',
    phone: '01325 000222',
    address: 'Darlington',
    paymentTermsDays: 14,
    createdAt: now,
  };
  const monument: Client = {
    id: uid(),
    name: 'Monument',
    contact: 'Site Office',
    email: 'tenders@monument.example',
    phone: '0191 000333',
    address: 'Woodside, Newcastle',
    paymentTermsDays: 30,
    createdAt: now,
  };
  const a1: Client = {
    id: uid(),
    name: 'A1 Construction',
    contact: '',
    email: '',
    phone: '',
    address: '',
    paymentTermsDays: 30,
    createdAt: now,
  };

  const clients = [gillespie, taylor, monument, a1];

  const jobs: Job[] = [
    {
      id: uid(),
      jobNumber: 25011,
      clientId: gillespie.id,
      project: '11 Coniscliffe',
      description: 'S/C Enquiries',
      feeNetPence: 48000,
      vatRate: 0.2,
      status: 'submitted',
      startDate: '2026-05-26',
      returnDate: '2026-06-22',
      isAsap: false,
      estimatedDays: 4,
      notes: '',
      invoiceId: null,
      createdAt: now,
    },
    {
      id: uid(),
      jobNumber: 25012,
      clientId: gillespie.id,
      project: 'Yarm Road',
      description: 'Tender enquiries',
      feeNetPence: 52000,
      vatRate: 0.2,
      status: 'working',
      startDate: '2026-06-08',
      returnDate: '2026-06-22',
      isAsap: false,
      estimatedDays: 5,
      notes: '',
      invoiceId: null,
      createdAt: now,
    },
    {
      id: uid(),
      jobNumber: 25014,
      clientId: gillespie.id,
      project: 'Fell Cottage',
      description: 'Second Floor Extension',
      feeNetPence: 67500,
      vatRate: 0.2,
      status: 'working',
      startDate: '2026-06-02',
      returnDate: '2026-06-12',
      isAsap: false,
      estimatedDays: 5,
      notes: 'Waiting for structural drawings.',
      invoiceId: null,
      createdAt: now,
    },
    {
      id: uid(),
      jobNumber: 25015,
      clientId: taylor.id,
      project: 'Loft Conversion',
      description: 'Domestic loft conversion',
      feeNetPence: 56000,
      vatRate: 0.2,
      status: 'planning',
      startDate: null,
      returnDate: null,
      isAsap: true,
      estimatedDays: 4,
      notes: 'Client wants this back as soon as possible.',
      invoiceId: null,
      createdAt: now,
    },
    {
      id: uid(),
      jobNumber: 25016,
      clientId: monument.id,
      project: '33 Woodside',
      description: 'New build tender',
      feeNetPence: 72000,
      vatRate: 0.2,
      status: 'planning',
      startDate: '2026-06-15',
      returnDate: '2026-06-18',
      isAsap: false,
      estimatedDays: 3,
      notes: '',
      invoiceId: null,
      createdAt: now,
    },
  ];

  await db.transaction('rw', db.clients, db.jobs, db.settings, async () => {
    await db.clients.bulkAdd(clients);
    await db.jobs.bulkAdd(jobs);
    await db.settings.put(defaultSettings);
  });
}

/** Seed only if the database is empty. Safe to call on every startup. */
export async function ensureSeeded(): Promise<void> {
  const count = await db.clients.count();
  if (count === 0) {
    await seedDemoData();
  }
}

/** Wipe everything and reseed — used by the "Reset demo data" button in Settings. */
export async function resetDemoData(): Promise<void> {
  await db.transaction('rw', db.clients, db.jobs, db.invoices, db.settings, async () => {
    await db.clients.clear();
    await db.jobs.clear();
    await db.invoices.clear();
    await db.settings.clear();
  });
  await seedDemoData();
}
