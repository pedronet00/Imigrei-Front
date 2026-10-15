import type { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import type { DashboardSummary } from '../../domain/entities/DashboardSummary';

export class DashboardService {
  private repository: IDashboardRepository;

  constructor(repository: IDashboardRepository) {
    this.repository = repository;
  }

  async getSummary(): Promise<DashboardSummary> {
    return this.repository.getSummary();
  }
}
