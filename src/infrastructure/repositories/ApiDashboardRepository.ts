import type { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import type { DashboardSummary } from '../../domain/entities/DashboardSummary';
import {
  API_BASE_URL,
  UnauthorizedError,
  authHeaders,
  numberToHistoryType,
  parseApiUtcDate,
  readProblemDetail,
} from '../http/apiClient';

export interface DashboardApiDto {
  totalImigrantes: number;
  novosEsteMes: number;
  totalNacionalidades: number;
  totalDocumentos: number;
  imigrantesPorNacionalidade: { paisOrigem: string; total: number }[];
  atividadeRecente: {
    acaoId: string;
    imigranteId: string;
    nomeImigrante: string;
    dataRegistro: string;
    acao: string;
    tipoAcao: number;
  }[];
}

export function mapApiDashboard(dto: DashboardApiDto): DashboardSummary {
  return {
    totalImmigrants: dto.totalImigrantes,
    newThisMonth: dto.novosEsteMes,
    totalNationalities: dto.totalNacionalidades,
    totalDocuments: dto.totalDocumentos,
    immigrantsByNationality: (dto.imigrantesPorNacionalidade ?? [])
      .map((n) => ({ country: n.paisOrigem, total: n.total }))
      .sort((a, b) => b.total - a.total),
    recentActivity: (dto.atividadeRecente ?? []).map((a) => ({
      id: a.acaoId,
      immigrantId: a.imigranteId,
      immigrantName: a.nomeImigrante,
      type: numberToHistoryType(a.tipoAcao),
      description: a.acao,
      date: parseApiUtcDate(a.dataRegistro),
    })),
  };
}

export class ApiDashboardRepository implements IDashboardRepository {
  private baseUrl = `${API_BASE_URL}/Dashboard`;

  async getSummary(): Promise<DashboardSummary> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao carregar o painel (HTTP ${response.status})`);
    }
    const data: DashboardApiDto = await response.json();
    return mapApiDashboard(data);
  }
}
