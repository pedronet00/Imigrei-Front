import type { DocumentFile } from '../entities/Document';
import type { ReportParams } from '../entities/Report';

export interface IReportRepository {
  generate(reportCode: string, params: ReportParams): Promise<DocumentFile>;
}
