import type { Immigrant } from '../entities/Immigrant';
import type { ImmigrantDocument, DocumentFile } from '../entities/Document';
import type { HistoryEntry, NewHistoryEntry } from '../entities/HistoryEntry';

export interface IImmigrantRepository {
  getAll(): Promise<Immigrant[]>;
  getById(id: string): Promise<Immigrant | null>;
  create(immigrant: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Immigrant>;
  update(id: string, data: Partial<Immigrant>): Promise<Immigrant>;
  delete(id: string): Promise<void>;

  getDocuments(immigrantId: string): Promise<ImmigrantDocument[]>;
  addDocument(immigrantId: string, file: File): Promise<ImmigrantDocument>;
  removeDocument(docId: string): Promise<void>;
  downloadDocument(doc: ImmigrantDocument): Promise<DocumentFile>;

  getHistory(immigrantId: string): Promise<HistoryEntry[]>;
  addHistoryEntry(immigrantId: string, entry: NewHistoryEntry): Promise<HistoryEntry>;
  updateHistoryEntry(entryId: string, entry: NewHistoryEntry): Promise<void>;
  removeHistoryEntry(entryId: string): Promise<void>;
}
