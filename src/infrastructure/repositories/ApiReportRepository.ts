import type { IReportRepository } from '../../domain/repositories/IReportRepository';
import type { DocumentFile } from '../../domain/entities/Document';
import type { ReportParams } from '../../domain/entities/Report';
import {
  API_BASE_URL,
  UnauthorizedError,
  authFetch,
  fileNameFromContentDisposition,
  readProblemDetail,
} from '../http/apiClient';

/**
 * Contract expected from the backend:
 *   GET /api/Relatorios/{codigo}?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&formato=pdf|xlsx
 *   200 → file body, with Content-Disposition carrying the file name
 */
export class ApiReportRepository implements IReportRepository {
  private baseUrl = `${API_BASE_URL}/Relatorios`;

  async generate(reportCode: string, params: ReportParams): Promise<DocumentFile> {
    const query = new URLSearchParams({ formato: params.format });
    if (params.startDate) query.set('dataInicio', params.startDate);
    if (params.endDate) query.set('dataFim', params.endDate);

    const response = await authFetch(`${this.baseUrl}/${reportCode}?${query}`, {
      method: 'GET',
    });
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (response.status === 404) {
      throw new Error('Este relatório ainda não está disponível no servidor.');
    }
    if (!response.ok) {
      const detail = await readProblemDetail(response);
      throw new Error(detail || `Erro ao gerar relatório (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const fileName =
      fileNameFromContentDisposition(response.headers.get('Content-Disposition')) ||
      `${reportCode}.${params.format}`;
    return { blob, fileName };
  }
}
