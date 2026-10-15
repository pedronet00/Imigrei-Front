import type { IImmigrantRepository } from '../../domain/repositories/IImmigrantRepository';
import type { Immigrant } from '../../domain/entities/Immigrant';
import type { ImmigrantDocument, DocumentFile } from '../../domain/entities/Document';
import type { HistoryEntry, NewHistoryEntry } from '../../domain/entities/HistoryEntry';

export class ImmigrantService {
  private repository: IImmigrantRepository;

  constructor(repository: IImmigrantRepository) {
    this.repository = repository;
  }

  async listAll(): Promise<Immigrant[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<Immigrant | null> {
    return this.repository.getById(id);
  }

  async create(
    data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Immigrant> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<Immigrant>): Promise<Immigrant> {
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async getDocuments(immigrantId: string): Promise<ImmigrantDocument[]> {
    return this.repository.getDocuments(immigrantId);
  }

  async addDocument(immigrantId: string, file: File): Promise<ImmigrantDocument> {
    return this.repository.addDocument(immigrantId, file);
  }

  async removeDocument(docId: string): Promise<void> {
    return this.repository.removeDocument(docId);
  }

  async downloadDocument(doc: ImmigrantDocument): Promise<DocumentFile> {
    return this.repository.downloadDocument(doc);
  }

  async getHistory(immigrantId: string): Promise<HistoryEntry[]> {
    return this.repository.getHistory(immigrantId);
  }

  async addHistoryEntry(immigrantId: string, entry: NewHistoryEntry): Promise<HistoryEntry> {
    return this.repository.addHistoryEntry(immigrantId, entry);
  }

  async updateHistoryEntry(entryId: string, entry: NewHistoryEntry): Promise<void> {
    return this.repository.updateHistoryEntry(entryId, entry);
  }

  async removeHistoryEntry(entryId: string): Promise<void> {
    return this.repository.removeHistoryEntry(entryId);
  }

  async search(query: string): Promise<Immigrant[]> {
    const all = await this.repository.getAll();
    const q = query.toLowerCase().trim();
    if (!q) return all;

    return all.filter(
      (i) =>
        i.fullName.toLowerCase().includes(q) ||
        i.cpf.includes(q) ||
        i.nationality.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.phone.includes(q)
    );
  }
}
