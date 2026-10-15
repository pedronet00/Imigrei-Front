import { useState } from 'react';
import {
  Users,
  Globe,
  MessagesSquare,
  FolderOpen,
  CircleAlert,
  ClipboardList,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { ReportService } from '../../../application/services/ReportService';
import { ApiReportRepository } from '../../../infrastructure/repositories/ApiReportRepository';
import { UnauthorizedError } from '../../../infrastructure/http/apiClient';
import type { ReportFormat } from '../../../domain/entities/Report';
import { saveBlob } from '../../utils/download';
import styles from '../../styles/panel.module.css';

interface ReportDefinition {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  usesPeriod: boolean;
}

// `code` is the path segment sent to GET /api/Relatorios/{code}
const REPORTS: ReportDefinition[] = [
  {
    code: 'imigrantes-cadastrados',
    title: 'Imigrantes cadastrados',
    description: 'Lista dos imigrantes cadastrados no período, com nacionalidade, contato e endereço.',
    icon: Users,
    tint: 'blue',
    usesPeriod: true,
  },
  {
    code: 'imigrantes-por-nacionalidade',
    title: 'Imigrantes por nacionalidade',
    description: 'Total de imigrantes por país de origem.',
    icon: Globe,
    tint: 'violet',
    usesPeriod: true,
  },
  {
    code: 'atendimentos',
    title: 'Atendimentos realizados',
    description: 'Ações registradas no período, agrupadas por tipo e por imigrante.',
    icon: MessagesSquare,
    tint: 'green',
    usesPeriod: true,
  },
  {
    code: 'pedidos-em-aberto',
    title: 'Pedidos em aberto',
    description: 'Imigrantes com um novo pedido sem finalização ou cancelamento registrados.',
    icon: ClipboardList,
    tint: 'teal',
    usesPeriod: false,
  },
  {
    code: 'documentos-enviados',
    title: 'Documentos enviados',
    description: 'Arquivos anexados aos cadastros no período.',
    icon: FolderOpen,
    tint: 'amber',
    usesPeriod: true,
  },
  {
    code: 'pendencias-cpf',
    title: 'Pendências de CPF',
    description: 'Imigrantes que ainda não têm CPF emitido.',
    icon: CircleAlert,
    tint: 'red',
    usesPeriod: false,
  },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
];

const reportService = new ReportService(new ApiReportRepository());

function ReportCard({ report }: { report: ReportDefinition }) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [generating, setGenerating] = useState(false);

  const invalidPeriod = !!startDate && !!endDate && startDate > endDate;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { blob, fileName } = await reportService.generate(report.code, {
        format,
        startDate: report.usesPeriod ? startDate || undefined : undefined,
        endDate: report.usesPeriod ? endDate || undefined : undefined,
      });
      saveBlob(blob, fileName);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        return;
      }
      console.error(`Falha ao gerar relatório ${report.code}:`, err);
      showToast(
        'error',
        'Não foi possível gerar o relatório',
        err instanceof Error && !(err instanceof TypeError)
          ? err.message
          : 'Não foi possível conectar ao servidor.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const Icon = report.icon;

  return (
    <div className={styles.reportCard}>
      <div className={styles.reportHead}>
        <div
          className={styles.reportIcon}
          style={{ background: `var(--tint-${report.tint}-bg)`, color: `var(--tint-${report.tint}-fg)` }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3 className={styles.cardTitle}>{report.title}</h3>
          <p className={styles.cardDescription}>{report.description}</p>
        </div>
      </div>

      {report.usesPeriod && (
        <div className={styles.reportFilters}>
          <Input
            label="De"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
          />
          <Input
            label="Até"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
            error={invalidPeriod ? 'Data final antes da inicial' : undefined}
          />
        </div>
      )}

      <div className={styles.reportFooter}>
        <Select
          label="Formato"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(e) => setFormat(e.target.value as ReportFormat)}
        />
        <Button onClick={handleGenerate} loading={generating} disabled={invalidPeriod}>
          <Download size={15} />
          Gerar
        </Button>
      </div>
    </div>
  );
}

export function Reports() {
  return (
    <PageContainer title="Relatórios">
      <div className={styles.stack} style={{ maxWidth: 'none' }}>
        <p className={styles.intro}>
          Escolha o relatório, o período e o formato. Sem período, o relatório considera todos os
          registros.
        </p>
        <div className={styles.reportGrid}>
          {REPORTS.map((report) => (
            <ReportCard key={report.code} report={report} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
