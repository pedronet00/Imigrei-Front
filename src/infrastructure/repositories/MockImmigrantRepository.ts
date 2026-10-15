import { v4 as uuidv4 } from 'uuid';
import type { IImmigrantRepository } from '../../domain/repositories/IImmigrantRepository';
import type { Immigrant } from '../../domain/entities/Immigrant';
import type { ImmigrantDocument, DocumentFile } from '../../domain/entities/Document';
import type { HistoryEntry, NewHistoryEntry } from '../../domain/entities/HistoryEntry';
import { mockImmigrants, mockDocuments, mockHistory } from '../data/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockImmigrantRepository implements IImmigrantRepository {
  private immigrants: Immigrant[] = [...mockImmigrants];
  private documents: ImmigrantDocument[] = [...mockDocuments];
  private history: HistoryEntry[] = [...mockHistory];

  async getAll(): Promise<Immigrant[]> {
    await delay(300);
    return [...this.immigrants];
  }

  async getById(id: string): Promise<Immigrant | null> {
    await delay(200);
    return this.immigrants.find((i) => i.id === id) ?? null;
  }

  async create(
    data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Immigrant> {
    await delay(400);
    const now = new Date().toISOString();
    const immigrant: Immigrant = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.immigrants.push(immigrant);
    return immigrant;
  }

  async update(id: string, data: Partial<Immigrant>): Promise<Immigrant> {
    await delay(400);
    const index = this.immigrants.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Imigrante não encontrado');

    this.immigrants[index] = {
      ...this.immigrants[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.immigrants[index];
  }

  async delete(id: string): Promise<void> {
    await delay(300);
    this.immigrants = this.immigrants.filter((i) => i.id !== id);
    this.documents = this.documents.filter((d) => d.immigrantId !== id);
    this.history = this.history.filter((h) => h.immigrantId !== id);
  }

  async getDocuments(immigrantId: string): Promise<ImmigrantDocument[]> {
    await delay(200);
    return this.documents
      .filter((d) => d.immigrantId === immigrantId)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  async addDocument(immigrantId: string, file: File): Promise<ImmigrantDocument> {
    await delay(400);
    const doc: ImmigrantDocument = {
      immigrantId,
      type: 'outro',
      name: file.name,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      id: uuidv4(),
      uploadDate: new Date().toISOString(),
    };
    this.documents.push(doc);
    return doc;
  }

  async removeDocument(docId: string): Promise<void> {
    await delay(300);
    this.documents = this.documents.filter((d) => d.id !== docId);
  }

  async downloadDocument(doc: ImmigrantDocument): Promise<DocumentFile> {
    await delay(200);
    return {
      blob: new Blob([`Documento de exemplo: ${doc.name}`], { type: 'text/plain' }),
      fileName: doc.fileName,
    };
  }

  async getHistory(immigrantId: string): Promise<HistoryEntry[]> {
    await delay(200);
    return this.history
      .filter((h) => h.immigrantId === immigrantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async addHistoryEntry(immigrantId: string, data: NewHistoryEntry): Promise<HistoryEntry> {
    await delay(400);
    const entry: HistoryEntry = {
      ...data,
      immigrantId,
      id: uuidv4(),
      date: new Date().toISOString(),
    };
    this.history.push(entry);
    return entry;
  }

  async updateHistoryEntry(entryId: string, data: NewHistoryEntry): Promise<void> {
    await delay(300);
    this.history = this.history.map((h) => (h.id === entryId ? { ...h, ...data } : h));
  }

  async removeHistoryEntry(entryId: string): Promise<void> {
    await delay(300);
    this.history = this.history.filter((h) => h.id !== entryId);
  }
}
