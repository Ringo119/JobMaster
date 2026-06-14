import { db } from '../../db';
import type { Client } from '../../models/client';
import type { ClientRepository } from '../types';

export class DexieClientRepository implements ClientRepository {
  async list(search?: string): Promise<Client[]> {
    const all = await db.clients.orderBy('name').toArray();
    if (!search) return all;
    const q = search.trim().toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(q));
  }

  async get(id: string): Promise<Client | undefined> {
    return db.clients.get(id);
  }

  async create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const client: Client = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.clients.add(client);
    return client;
  }

  async update(id: string, patch: Partial<Client>): Promise<Client> {
    await db.clients.update(id, patch);
    const updated = await db.clients.get(id);
    if (!updated) throw new Error(`Client ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.clients.delete(id);
  }
}
