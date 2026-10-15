export type ReportFormat = 'pdf' | 'xlsx';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  format: ReportFormat;
}
