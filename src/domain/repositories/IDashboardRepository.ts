import type { DashboardSummary } from '../entities/DashboardSummary';

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}
