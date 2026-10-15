import type { IReportRepository } from '../../domain/repositories/IReportRepository';
import type { DocumentFile } from '../../domain/entities/Document';
import type { ReportParams } from '../../domain/entities/Report';

export class ReportService {
  private repository: IReportRepository;

  constructor(repository: IReportRepository) {
    this.repository = repository;
  }

  async generate(reportCode: string, params: ReportParams): Promise<DocumentFile> {
    return this.repository.generate(reportCode, params);
  }
}
