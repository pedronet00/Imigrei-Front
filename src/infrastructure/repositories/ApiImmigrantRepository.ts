import type { IImmigrantRepository } from '../../domain/repositories/IImmigrantRepository';
import type { Immigrant, MaritalStatus, EntryMeans } from '../../domain/entities/Immigrant';
import type { ImmigrantDocument, DocumentFile } from '../../domain/entities/Document';
import type { HistoryEntry, NewHistoryEntry } from '../../domain/entities/HistoryEntry';
import { MockImmigrantRepository } from './MockImmigrantRepository';
import {
  API_BASE_URL,
  UnauthorizedError,
  authFetch,
  fileNameFromContentDisposition,
  historyTypeToNumber,
  numberToHistoryType,
  parseApiUtcDate,
  readProblemDetail,
} from '../http/apiClient';

export interface ImmigrantListApiDto {
  id: string;
  nome: string;
  dataNascimento: string;
  estadoCivil: number;
  email: string;
  paisOrigem: string;
  cidade: string;
  uf: string;
}

export interface ImmigrantFileApiDto {
  id: string;
  imigranteId: string;
  nomeOriginal: string;
  contentType: string;
  tamanhoBytes: number;
  hashSha256: string;
  tipoArquivo: number;
  dataUpload: string;
}

export function mapApiFileToDocument(file: ImmigrantFileApiDto): ImmigrantDocument {
  return {
    id: file.id,
    immigrantId: file.imigranteId,
    type: 'outro',
    typeCode: file.tipoArquivo,
    name: file.nomeOriginal,
    fileName: file.nomeOriginal,
    uploadDate: parseApiUtcDate(file.dataUpload),
    contentType: file.contentType,
    sizeBytes: Number(file.tamanhoBytes),
  };
}

export interface ImmigrantActionApiDto {
  id: string;
  imigranteId: string;
  acao: string;
  tipoAcao: number;
  dataRegistro: string;
}

export function mapApiActionToHistoryEntry(action: ImmigrantActionApiDto): HistoryEntry {
  return {
    id: action.id,
    immigrantId: action.imigranteId,
    type: numberToHistoryType(action.tipoAcao),
    description: action.acao,
    date: parseApiUtcDate(action.dataRegistro),
  };
}

export interface ImmigrantCreateApiDto {
  nome: string;
  dataNascimento: string;
  estadoCivil: number;
  cidadeOrigem: string;
  paisOrigem: string;
  idiomaPrincipal: string;
  email: string;
  ocupacaoPrincipal: string;
  statusEmissaoCPF: number;
  cpf: string | null;
  nomeMae: string;
  nomePai: string;
  taxaRnm: boolean;
  documentoViagem: number;
  paisEmissorDocumentoViagem: string;
  numeroDocumentoViagem: string;
  dataEntradaBrasil: string;
  meioEntradaBrasil: number;
  cidadeEntradaBrasil: string;
  ufEntradaBrasil: string;
  cep: string;
  logradouro: string;
  numero: number;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cepTrabalho: string;
  logradouroTrabalho: string;
  numeroTrabalho: number;
  complementoTrabalho: string | null;
  bairroTrabalho: string;
  cidadeTrabalho: string;
  ufTrabalho: string;
  telefone: string;
}

const maritalStatusMapToNumber: Record<MaritalStatus, number> = {
  solteiro: 1,
  casado: 2,
  divorciado: 3,
  viuvo: 4,
  uniao_estavel: 5,
  separado: 6,
};

const numberToMaritalStatusMap: Record<number, MaritalStatus> = {
  1: 'solteiro',
  2: 'casado',
  3: 'divorciado',
  4: 'viuvo',
  5: 'uniao_estavel',
  6: 'separado',
};

const entryMeansMapToNumber: Record<EntryMeans, number> = {
  aereo: 1,
  terrestre: 2,
  maritimo: 3,
  fluvial: 4,
};

const numberToEntryMeansMap: Record<number, EntryMeans> = {
  1: 'aereo',
  2: 'terrestre',
  3: 'maritimo',
  4: 'fluvial',
};

export function maritalStatusToNumber(status?: MaritalStatus): number {
  return status ? maritalStatusMapToNumber[status] ?? 1 : 1;
}

export function numberToMaritalStatus(num?: number): MaritalStatus {
  return num ? numberToMaritalStatusMap[num] ?? 'solteiro' : 'solteiro';
}

export function entryMeansToNumber(means?: EntryMeans): number {
  return means ? entryMeansMapToNumber[means] ?? 1 : 1;
}

export function numberToEntryMeans(num?: number): EntryMeans {
  return num ? numberToEntryMeansMap[num] ?? 'terrestre' : 'terrestre';
}

export function mapImmigrantToApiCreateDto(
  data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'> | Immigrant
): ImmigrantCreateApiDto {
  const parseNum = (val?: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const p = parseInt(val.replace(/\D/g, ''), 10);
    return isNaN(p) ? 0 : p;
  };

  return {
    nome: data.fullName || '',
    dataNascimento: data.birthDate || new Date().toISOString(),
    estadoCivil: maritalStatusToNumber(data.maritalStatus),
    cidadeOrigem: data.birthCity || '',
    paisOrigem: data.nationality || '',
    idiomaPrincipal: data.mainLanguage || '',
    email: data.email || '',
    ocupacaoPrincipal: data.occupation || '',
    statusEmissaoCPF: data.cpfStatus ?? 1,
    cpf: data.cpf ? data.cpf : null,
    nomeMae: data.motherName || '',
    nomePai: data.fatherName || '',
    taxaRnm: data.rnmFeePaid ?? true,
    documentoViagem: data.travelDocumentType ?? 0,
    paisEmissorDocumentoViagem: data.travelDocumentIssuerCountry || '',
    numeroDocumentoViagem: data.travelDocumentNumber || '',
    dataEntradaBrasil: data.entryDate || new Date().toISOString(),
    meioEntradaBrasil: entryMeansToNumber(data.entryMeans),
    cidadeEntradaBrasil: data.entryCity || '',
    ufEntradaBrasil: data.entryState || '',
    cep: data.brazilAddress?.zipCode || '',
    logradouro: data.brazilAddress?.street || '',
    numero: parseNum(data.brazilAddress?.number),
    complemento: data.brazilAddress?.complement || null,
    bairro: data.brazilAddress?.neighborhood || '',
    cidade: data.brazilAddress?.city || '',
    uf: data.brazilAddress?.state || '',
    cepTrabalho: data.workAddress?.zipCode || '',
    logradouroTrabalho: data.workAddress?.street || '',
    numeroTrabalho: parseNum(data.workAddress?.number),
    complementoTrabalho: data.workAddress?.complement || null,
    bairroTrabalho: data.workAddress?.neighborhood || '',
    cidadeTrabalho: data.workAddress?.city || '',
    ufTrabalho: data.workAddress?.state || '',
    telefone: data.phone || '',
  };
}

export function mapApiDtoToImmigrant(apiItem: any): Immigrant {
  const hasWorkAddress =
    !!apiItem.logradouroTrabalho || !!apiItem.cidadeTrabalho || !!apiItem.cepTrabalho;

  return {
    id: apiItem.id || String(Math.random()),
    fullName: apiItem.nome || apiItem.fullName || '',
    motherName: apiItem.nomeMae || '',
    fatherName: apiItem.nomePai || '',
    nationality: apiItem.paisOrigem || apiItem.nationality || '',
    birthCity: apiItem.cidadeOrigem || apiItem.birthCity || '',
    birthDate: apiItem.dataNascimento || apiItem.birthDate || '',
    gender: apiItem.gender || 'nao_informado',
    maritalStatus:
      typeof apiItem.estadoCivil === 'number'
        ? numberToMaritalStatus(apiItem.estadoCivil)
        : apiItem.maritalStatus || 'solteiro',
    email: apiItem.email || '',
    occupation: apiItem.ocupacaoPrincipal || apiItem.occupation || '',
    cpf: apiItem.cpf || '',
    entryDate: apiItem.dataEntradaBrasil || apiItem.entryDate || '',
    entryState: apiItem.ufEntradaBrasil || apiItem.uf || apiItem.entryState || '',
    entryMeans:
      typeof apiItem.meioEntradaBrasil === 'number'
        ? numberToEntryMeans(apiItem.meioEntradaBrasil)
        : apiItem.entryMeans || 'terrestre',
    entryCity: apiItem.cidadeEntradaBrasil || apiItem.cidade || apiItem.entryCity || '',
    brazilAddress: {
      street: apiItem.logradouro || apiItem.brazilAddress?.street || '',
      number:
        apiItem.numero !== undefined && apiItem.numero !== null
          ? String(apiItem.numero)
          : apiItem.brazilAddress?.number || '',
      complement: apiItem.complemento || apiItem.brazilAddress?.complement || '',
      neighborhood: apiItem.bairro || apiItem.brazilAddress?.neighborhood || '',
      city: apiItem.cidade || apiItem.brazilAddress?.city || '',
      state: apiItem.uf || apiItem.brazilAddress?.state || '',
      zipCode: apiItem.cep || apiItem.brazilAddress?.zipCode || '',
    },
    workAddress: hasWorkAddress
      ? {
          street: apiItem.logradouroTrabalho || apiItem.workAddress?.street || '',
          number:
            apiItem.numeroTrabalho !== undefined && apiItem.numeroTrabalho !== null
              ? String(apiItem.numeroTrabalho)
              : apiItem.workAddress?.number || '',
          complement: apiItem.complementoTrabalho || apiItem.workAddress?.complement || '',
          neighborhood: apiItem.bairroTrabalho || apiItem.workAddress?.neighborhood || '',
          city: apiItem.cidadeTrabalho || apiItem.workAddress?.city || '',
          state: apiItem.ufTrabalho || apiItem.workAddress?.state || '',
          zipCode: apiItem.cepTrabalho || apiItem.workAddress?.zipCode || '',
        }
      : apiItem.workAddress,
    phone: apiItem.telefone || apiItem.phone || '',
    referralSource: apiItem.referralSource || 'semear',
    referralSourceDetail: apiItem.referralSourceDetail,
    createdAt: apiItem.dataCadastro
      ? parseApiUtcDate(apiItem.dataCadastro)
      : apiItem.createdAt || new Date().toISOString(),
    updatedAt: apiItem.updatedAt || new Date().toISOString(),
    mainLanguage: apiItem.idiomaPrincipal || apiItem.mainLanguage,
    cpfStatus: apiItem.statusEmissaoCPF ?? apiItem.cpfStatus,
    rnmFeePaid: apiItem.taxaRnm ?? apiItem.rnmFeePaid,
    travelDocumentType: apiItem.documentoViagem ?? apiItem.travelDocumentType,
    travelDocumentIssuerCountry:
      apiItem.paisEmissorDocumentoViagem || apiItem.travelDocumentIssuerCountry,
    travelDocumentNumber: apiItem.numeroDocumentoViagem || apiItem.travelDocumentNumber,
  };
}

export class ApiImmigrantRepository implements IImmigrantRepository {
  private baseUrl = `${API_BASE_URL}/Imigrantes`;
  private filesBaseUrl = `${API_BASE_URL}/ImigranteArquivos`;
  private actionsBaseUrl = `${API_BASE_URL}/ImigranteAcoes`;
  private mockFallback = new MockImmigrantRepository();

  async getAll(): Promise<Immigrant[]> {
    const response = await authFetch(this.baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`Erro ao carregar imigrantes (HTTP ${response.status})`);
    }
    const data: ImmigrantListApiDto[] = await response.json();
    return Array.isArray(data) ? data.map((item) => mapApiDtoToImmigrant(item)) : [];
  }

  async getById(id: string): Promise<Immigrant | null> {
    const response = await authFetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (response.ok) {
      const item = await response.json();
      return mapApiDtoToImmigrant(item);
    }
    // Fallback: search in list
    const all = await this.getAll();
    return all.find((i) => i.id === id) || null;
  }

  async create(
    data: Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Immigrant> {
    const payload = mapImmigrantToApiCreateDto(data);

    const response = await authFetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao cadastrar imigrante (HTTP ${response.status})`);
    }

    let resData;
    try {
      resData = await response.json();
    } catch {
      resData = null;
    }

    if (resData) {
      return mapApiDtoToImmigrant(resData);
    }

    return mapApiDtoToImmigrant({ ...payload, id: String(Date.now()) });
  }

  async update(id: string, data: Partial<Immigrant>): Promise<Immigrant> {
    const existing = await this.getById(id);
    const merged = { ...existing, ...data } as Immigrant;
    const payload = mapImmigrantToApiCreateDto(merged);

    const response = await authFetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao atualizar imigrante (HTTP ${response.status})`);
    }

    let resData;
    try {
      resData = await response.json();
    } catch {
      resData = merged;
    }

    return mapApiDtoToImmigrant(resData);
  }

  async delete(id: string): Promise<void> {
    const response = await authFetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao remover imigrante (HTTP ${response.status})`);
    }
  }

  async getDocuments(immigrantId: string): Promise<ImmigrantDocument[]> {
    const response = await authFetch(`${this.filesBaseUrl}/imigrante/${immigrantId}`, {
      method: 'GET',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`Erro ao carregar documentos (HTTP ${response.status})`);
    }
    const data: ImmigrantFileApiDto[] = await response.json();
    return Array.isArray(data)
      ? data
          .map(mapApiFileToDocument)
          .sort((x, y) => new Date(y.uploadDate).getTime() - new Date(x.uploadDate).getTime())
      : [];
  }

  async downloadDocument(doc: ImmigrantDocument): Promise<DocumentFile> {
    const response = await authFetch(`${this.filesBaseUrl}/${doc.id}/download`, {
      method: 'GET',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`Erro ao baixar documento (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    const fileName =
      fileNameFromContentDisposition(response.headers.get('Content-Disposition')) ||
      doc.fileName;
    return { blob, fileName };
  }

  async addDocument(immigrantId: string, file: File): Promise<ImmigrantDocument> {
    const formData = new FormData();
    formData.append('arquivo', file);

    const response = await authFetch(`${this.filesBaseUrl}/imigrante/${immigrantId}`, {
      method: 'POST',
      body: formData,
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao enviar documento (HTTP ${response.status})`);
    }
    const data: ImmigrantFileApiDto = await response.json();
    return mapApiFileToDocument(data);
  }

  async removeDocument(docId: string): Promise<void> {
    return this.mockFallback.removeDocument(docId);
  }

  async getHistory(immigrantId: string): Promise<HistoryEntry[]> {
    const response = await authFetch(`${this.actionsBaseUrl}/imigrante/${immigrantId}`, {
      method: 'GET',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`Erro ao carregar histórico (HTTP ${response.status})`);
    }
    const data: ImmigrantActionApiDto[] = await response.json();
    return Array.isArray(data)
      ? data
          .map(mapApiActionToHistoryEntry)
          .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())
      : [];
  }

  async addHistoryEntry(immigrantId: string, entry: NewHistoryEntry): Promise<HistoryEntry> {
    const response = await authFetch(`${this.actionsBaseUrl}/imigrante/${immigrantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: entry.description,
        tipoAcao: historyTypeToNumber(entry.type),
      }),
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao registrar ação (HTTP ${response.status})`);
    }
    const data: ImmigrantActionApiDto = await response.json();
    return mapApiActionToHistoryEntry(data);
  }

  async updateHistoryEntry(entryId: string, entry: NewHistoryEntry): Promise<void> {
    const response = await authFetch(`${this.actionsBaseUrl}/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: entry.description,
        tipoAcao: historyTypeToNumber(entry.type),
      }),
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao atualizar ação (HTTP ${response.status})`);
    }
  }

  async removeHistoryEntry(entryId: string): Promise<void> {
    const response = await authFetch(`${this.actionsBaseUrl}/${entryId}`, {
      method: 'DELETE',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao remover ação (HTTP ${response.status})`);
    }
  }
}
