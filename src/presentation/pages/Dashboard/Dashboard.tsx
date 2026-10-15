import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Globe, FileText } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { HISTORY_TYPE_CONFIG } from '../../constants/historyTypes';
import { DashboardService } from '../../../application/services/DashboardService';
import { ApiDashboardRepository } from '../../../infrastructure/repositories/ApiDashboardRepository';
import { UnauthorizedError } from '../../../infrastructure/http/apiClient';
import type { DashboardSummary } from '../../../domain/entities/DashboardSummary';
import { NationalityPieChart } from './NationalityPieChart';
import styles from './Dashboard.module.css';

const dashboardService = new DashboardService(new ApiDashboardRepository());

const relativeTimeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

function formatRelativeTime(date: string): string {
  const diffSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeTimeFormat.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return 'agora mesmo';
}

export function Dashboard() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await dashboardService.getSummary());
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        return;
      }
      console.error('Falha ao carregar o painel:', err);
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
    load();
  }, [load]);

  if (loading && !summary) {
    return (
      <PageContainer title="Painel">
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error || !summary) {
    return (
      <PageContainer title="Painel">
        <EmptyState
          title="Erro ao carregar o painel"
          description={error ?? 'Não foi possível carregar os dados.'}
          action={
            <Button variant="secondary" onClick={() => load()}>
              Tentar novamente
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Painel">
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total de Imigrantes</span>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}
            >
              <Users size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{summary.totalImmigrants}</div>
          <span className={styles.statChange}>cadastrados no sistema</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Novos este Mês</span>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}
            >
              <UserPlus size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{summary.newThisMonth}</div>
          <span className={styles.statChange}>cadastrados neste mês</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Nacionalidades</span>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--tint-violet-bg)', color: 'var(--tint-violet-fg)' }}
            >
              <Globe size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{summary.totalNationalities}</div>
          <span className={styles.statChange}>países representados</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Documentos</span>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}
            >
              <FileText size={18} />
            </div>
          </div>
          <div className={styles.statValue}>{summary.totalDocuments}</div>
          <span className={styles.statChange}>arquivos enviados</span>
        </div>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Imigrantes por Nacionalidade</h3>
            <Link to="/imigrantes" className={styles.sectionLink}>
              Ver todos →
            </Link>
          </div>
          <div className={styles.chartContainer}>
            <NationalityPieChart data={summary.immigrantsByNationality} />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Atividade Recente</h3>
          </div>
          <div className={styles.activityList}>
            {summary.recentActivity.length === 0 ? (
              <div className={styles.activityMeta}>Nenhuma ação registrada.</div>
            ) : (
              summary.recentActivity.map((act) => {
                const config = HISTORY_TYPE_CONFIG[act.type];
                const Icon = config.icon;
                return (
                  <Link
                    key={act.id}
                    to={`/imigrantes/${act.immigrantId}`}
                    className={styles.activityItem}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className={styles.activityIcon}
                      style={{ background: config.bg, color: config.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>
                        {config.label} — {act.immigrantName}
                      </div>
                      <div className={styles.activityMeta}>
                        {act.description} • {formatRelativeTime(act.date)}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
