import { addDays } from 'date-fns';
import { db } from '../../db';
import type { Invoice } from '../../models/invoice';
import { computeVat } from '../../../lib/vat';
import { toISODate } from '../../../lib/dates';
import { uuid } from '../../../lib/uuid';
import type { InvoiceRepository } from '../types';
import { DexieSettingsRepository } from './settingsRepo';

const settingsRepo = new DexieSettingsRepository();

const DEFAULT_PAYMENT_TERMS_DAYS = 30;

export class DexieInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    const invoices = await db.invoices.toArray();
    // Newest first by issue date, then by invoice number.
    return invoices.sort(
      (a, b) =>
        b.dateIssued.localeCompare(a.dateIssued) ||
        b.invoiceNumber.localeCompare(a.invoiceNumber),
    );
  }

  async listByClient(clientId: string): Promise<Invoice[]> {
    return db.invoices.where('clientId').equals(clientId).toArray();
  }

  async get(id: string): Promise<Invoice | undefined> {
    return db.invoices.get(id);
  }

  async getByJob(jobId: string): Promise<Invoice | undefined> {
    return db.invoices.where('jobId').equals(jobId).first();
  }

  async createFromJob(jobId: string): Promise<Invoice> {
    return db.transaction(
      'rw',
      db.invoices,
      db.jobs,
      db.clients,
      db.settings,
      async () => {
        const job = await db.jobs.get(jobId);
        if (!job) throw new Error(`Job ${jobId} not found`);

        const existing = await db.invoices.where('jobId').equals(jobId).first();
        if (existing) {
          throw new Error('This job already has an invoice.');
        }

        const client = await db.clients.get(job.clientId);
        const termsDays = client?.paymentTermsDays ?? DEFAULT_PAYMENT_TERMS_DAYS;

        const { netPence, vatPence, grossPence } = computeVat(
          job.feeNetPence,
          job.vatRate,
        );
        const issued = new Date();
        const invoiceNumber = await settingsRepo.nextInvoiceNumber();

        const invoice: Invoice = {
          id: uuid(),
          invoiceNumber,
          jobId: job.id,
          clientId: job.clientId,
          dateIssued: toISODate(issued),
          netTotalPence: netPence,
          vatTotalPence: vatPence,
          grossTotalPence: grossPence,
          status: 'draft',
          dueDate: toISODate(addDays(issued, termsDays)),
        };

        await db.invoices.add(invoice);
        // Automation: creating an invoice advances the job to "invoiced".
        await db.jobs.update(job.id, { invoiceId: invoice.id, status: 'invoiced' });
        return invoice;
      },
    );
  }

  async markSent(id: string): Promise<Invoice> {
    await db.invoices.update(id, { status: 'sent' });
    return this.requireGet(id);
  }

  async markPaid(id: string): Promise<Invoice> {
    return db.transaction('rw', db.invoices, db.jobs, async () => {
      const invoice = await db.invoices.get(id);
      if (!invoice) throw new Error(`Invoice ${id} not found`);
      await db.invoices.update(id, { status: 'paid' });
      // Automation: payment closes the job.
      await db.jobs.update(invoice.jobId, { status: 'paid' });
      return { ...invoice, status: 'paid' as const };
    });
  }

  private async requireGet(id: string): Promise<Invoice> {
    const invoice = await db.invoices.get(id);
    if (!invoice) throw new Error(`Invoice ${id} not found`);
    return invoice;
  }
}
