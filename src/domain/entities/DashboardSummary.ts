import type { HistoryType } from './HistoryEntry';

export interface NationalityCount {
  country: string;
  total: number;
}

export interface RecentActivity {
  id: string;
  immigrantId: string;
  immigrantName: string;
  type: HistoryType;
  description: string;
  date: string;
}

export interface DashboardSummary {
  totalImmigrants: number;
  newThisMonth: number;
  totalNationalities: number;
  totalDocuments: number;
  immigrantsByNationality: NationalityCount[];
  recentActivity: RecentActivity[];
}
