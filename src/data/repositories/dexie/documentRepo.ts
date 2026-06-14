import { db } from '../../db';
import { uuid } from '../../../lib/uuid';
import type { JobDocument } from '../../models/document';
import type { DocumentRepository } from '../types';

export class DexieDocumentRepository implements DocumentRepository {
  async listByJob(jobId: string): Promise<JobDocument[]> {
    const docs = await db.documents.where('jobId').equals(jobId).toArray();
    // Newest first.
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(data: Omit<JobDocument, 'id' | 'createdAt'>): Promise<JobDocument> {
    const doc: JobDocument = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.documents.add(doc);
    return doc;
  }

  async remove(id: string): Promise<void> {
    await db.documents.delete(id);
  }
}
