import { db } from '../../db';
import type { Invoice } from '../../models/invoice';
import type { InvoiceRepository } from '../types';

// Phase 2 will add create/issue logic. Read methods exist now so the Dashboard
// and Client details can show invoice data once it is present.
export class DexieInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    return db.invoices.toArray();
  }

  async listByClient(clientId: string): Promise<Invoice[]> {
    return db.invoices.where('clientId').equals(clientId).toArray();
  }

  async get(id: string): Promise<Invoice | undefined> {
    return db.invoices.get(id);
  }
}
