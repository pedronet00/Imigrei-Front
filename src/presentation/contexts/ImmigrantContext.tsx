import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Immigrant } from '../../domain/entities/Immigrant';
import type { ImmigrantDocument, DocumentFile } from '../../domain/entities/Document';
import type { HistoryEntry, NewHistoryEntry } from '../../domain/entities/HistoryEntry';
import { ImmigrantService } from '../../application/services/ImmigrantService';
import { ApiImmigrantRepository } from '../../infrastructure/repositories/ApiImmigrantRepository';
import { UnauthorizedError } from '../../infrastructure/http/apiClient';
import { useAuth } from './AuthContext';

interface ImmigrantContextValue {
  immigrants: Immigrant[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getById: (id: string) => Promise<Immigrant | null>;
  create: (data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Immigrant>;
  update: (id: string, data: Partial<Immigrant>) => Promise<Immigrant>;
  remove: (id: string) => Promise<void>;
  search: (query: string) => Promise<Immigrant[]>;
  getDocuments: (immigrantId: string) => Promise<ImmigrantDocument[]>;
  addDocument: (immigrantId: string, file: File) => Promise<ImmigrantDocument>;
  removeDocument: (docId: string) => Promise<void>;
  downloadDocument: (doc: ImmigrantDocument) => Promise<DocumentFile>;
  getHistory: (immigrantId: string) => Promise<HistoryEntry[]>;
  addHistoryEntry: (immigrantId: string, entry: NewHistoryEntry) => Promise<HistoryEntry>;
  updateHistoryEntry: (entryId: string, entry: NewHistoryEntry) => Promise<void>;
  removeHistoryEntry: (entryId: string) => Promise<void>;
}

const ImmigrantContext = createContext<ImmigrantContextValue | null>(null);

const repository = new ApiImmigrantRepository();
const service = new ImmigrantService(repository);

export function useImmigrants() {
  const ctx = useContext(ImmigrantContext);
  if (!ctx) throw new Error('useImmigrants must be used within ImmigrantProvider');
  return ctx;
}

export function ImmigrantProvider({ children }: { children: ReactNode }) {
  const [immigrants, setImmigrants] = useState<Immigrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.listAll();
      setImmigrants(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        return;
      }
      console.error('Falha ao carregar imigrantes:', err);
      setImmigrants([]);
      setError(
        err instanceof Error && !(err instanceof TypeError)
          ? err.message
          : 'Não foi possível conectar ao servidor.'
      );
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setImmigrants([]);
      setError(null);
    }
  }, [isAuthenticated, refresh]);

  const create = useCallback(
    async (data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await service.create(data);
      await refresh();
      return created;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, data: Partial<Immigrant>) => {
      const updated = await service.update(id, data);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await service.remove(id);
      await refresh();
    },
    [refresh]
  );

  const searchFn = useCallback(async (query: string) => {
    return service.search(query);
  }, []);

  const getById = useCallback(async (id: string) => {
    return service.getById(id);
  }, []);

  const getDocuments = useCallback(async (immigrantId: string) => {
    return service.getDocuments(immigrantId);
  }, []);

  const addDocument = useCallback(async (immigrantId: string, file: File) => {
    return service.addDocument(immigrantId, file);
  }, []);

  const removeDocument = useCallback(async (docId: string) => {
    return service.removeDocument(docId);
  }, []);

  const downloadDocument = useCallback(async (doc: ImmigrantDocument) => {
    return service.downloadDocument(doc);
  }, []);

  const getHistory = useCallback(async (immigrantId: string) => {
    return service.getHistory(immigrantId);
  }, []);

  const addHistoryEntry = useCallback(async (immigrantId: string, entry: NewHistoryEntry) => {
    return service.addHistoryEntry(immigrantId, entry);
  }, []);

  const updateHistoryEntry = useCallback(async (entryId: string, entry: NewHistoryEntry) => {
    return service.updateHistoryEntry(entryId, entry);
  }, []);

  const removeHistoryEntry = useCallback(async (entryId: string) => {
    return service.removeHistoryEntry(entryId);
  }, []);

  return (
    <ImmigrantContext.Provider
      value={{
        immigrants,
        loading,
        error,
        refresh,
        getById,
        create,
        update,
        remove,
        search: searchFn,
        getDocuments,
        addDocument,
        removeDocument,
        downloadDocument,
        getHistory,
        addHistoryEntry,
        updateHistoryEntry,
        removeHistoryEntry,
      }}
    >
      {children}
    </ImmigrantContext.Provider>
  );
}
