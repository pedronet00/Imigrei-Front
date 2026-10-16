import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  User,
  Plus,
  Trash2,
  Download,
  Phone,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { useImmigrants } from '../../contexts/ImmigrantContext';
import { useToast } from '../../components/ui/Toast';
import type { Immigrant, Address } from '../../../domain/entities/Immigrant';
import type { ImmigrantDocument, DocumentType } from '../../../domain/entities/Document';
import type { HistoryEntry, HistoryType } from '../../../domain/entities/HistoryEntry';
import { HISTORY_TYPE_CONFIG } from '../../constants/historyTypes';
import {
  CPF_STATUS_OPTIONS,
  TRAVEL_DOCUMENT_OPTIONS,
  optionLabel,
} from '../../constants/immigrantOptions';
import { saveBlob } from '../../utils/download';
import styles from './ImmigrantDossier.module.css';

type Tab = 'dados' | 'documentos' | 'historico';


const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  passaporte: 'Passaporte',
  rne: 'RNE',
  crnm: 'CRNM',
  ctps: 'CTPS',
  cpf: 'CPF',
  comprovante_residencia: 'Comprovante de Residência',
  certidao_nascimento: 'Certidão de Nascimento',
  certidao_casamento: 'Certidão de Casamento',
  diploma: 'Diploma',
  protocolo_refugio: 'Protocolo de Refúgio',
  outro: 'Outro',
};


const HISTORY_TYPE_OPTIONS = Object.entries(HISTORY_TYPE_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

const MARITAL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
  separado: 'Separado(a)',
};

const ENTRY_MEANS_LABELS: Record<string, string> = {
  aereo: 'Aéreo',
  terrestre: 'Terrestre',
  maritimo: 'Marítimo',
  fluvial: 'Fluvial',
};

export function ImmigrantDossier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getById,
    getDocuments,
    addDocument,
    removeDocument,
    downloadDocument,
    getHistory,
    addHistoryEntry,
    updateHistoryEntry,
    removeHistoryEntry,
  } = useImmigrants();
  const { showToast } = useToast();

  const [immigrant, setImmigrant] = useState<Immigrant | null>(null);
  const [documents, setDocuments] = useState<ImmigrantDocument[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('dados');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newHistory, setNewHistory] = useState({ type: 'novo_pedido' as HistoryType, description: '' });
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [imm, docs, hist] = await Promise.all([
        getById(id),
        getDocuments(id).catch((err) => {
          console.error('Falha ao carregar documentos:', err);
          showToast('error', 'Erro ao carregar documentos', err instanceof Error ? err.message : undefined);
          return [] as ImmigrantDocument[];
        }),
        getHistory(id).catch((err) => {
          console.error('Falha ao carregar histórico:', err);
          showToast('error', 'Erro ao carregar histórico', err instanceof Error ? err.message : undefined);
          return [] as HistoryEntry[];
        }),
      ]);
      setImmigrant(imm);
      setDocuments(docs);
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  }, [id, getById, getDocuments, getHistory, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDocument = async () => {
    if (!id || !newDocFile) return;
    setSaving(true);
    try {
      await addDocument(id, newDocFile);
      setDocModalOpen(false);
      setNewDocFile(null);
      const docs = await getDocuments(id);
      setDocuments(docs);
      showToast('success', 'Documento adicionado');
    } catch (err) {
      console.error('Falha ao enviar documento:', err);
      showToast('error', 'Erro ao enviar documento', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDoc = async (docId: string) => {
    if (!id || !window.confirm('Remover este documento?')) return;
    await removeDocument(docId);
    const docs = await getDocuments(id);
    setDocuments(docs);
    showToast('success', 'Documento removido');
  };

  const handleDownloadDoc = async (doc: ImmigrantDocument) => {
    setDownloadingId(doc.id);
    try {
      const { blob, fileName } = await downloadDocument(doc);
      saveBlob(blob, fileName);
    } catch (err) {
      console.error('Falha ao baixar documento:', err);
      showToast('error', 'Erro ao baixar documento', err instanceof Error ? err.message : undefined);
    } finally {
      setDownloadingId(null);
    }
  };

  const openNewHistoryModal = () => {
    setEditingHistoryId(null);
    setNewHistory({ type: 'novo_pedido', description: '' });
    setHistoryModalOpen(true);
  };

  const openEditHistoryModal = (entry: HistoryEntry) => {
    setEditingHistoryId(entry.id);
    setNewHistory({ type: entry.type, description: entry.description });
    setHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    setEditingHistoryId(null);
  };

  const handleSaveHistory = async () => {
    if (!id || !newHistory.description.trim()) return;
    setSaving(true);
    const entry = { type: newHistory.type, description: newHistory.description.trim() };
    try {
      if (editingHistoryId) {
        await updateHistoryEntry(editingHistoryId, entry);
      } else {
        await addHistoryEntry(id, entry);
      }
      closeHistoryModal();
      const hist = await getHistory(id);
      setHistory(hist);
      showToast('success', editingHistoryId ? 'Ação atualizada' : 'Ação registrada');
    } catch (err) {
      console.error('Falha ao salvar ação:', err);
      showToast('error', 'Erro ao salvar ação', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHistory = async (entryId: string) => {
    if (!id || !window.confirm('Remover esta ação?')) return;
    try {
      await removeHistoryEntry(entryId);
      const hist = await getHistory(id);
      setHistory(hist);
      showToast('success', 'Ação removida');
    } catch (err) {
      console.error('Falha ao remover ação:', err);
      showToast('error', 'Erro ao remover ação', err instanceof Error ? err.message : undefined);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDateTime = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderRow = (label: string, value?: string | null | false) => (
    <div className={styles.dataRow}>
      <span className={styles.dataLabel}>{label}</span>
      <span className={styles.dataValue}>{value || '—'}</span>
    </div>
  );

  const renderAddressRows = (addr?: Address) => (
    <>
      {renderRow('CEP', addr?.zipCode)}
      {renderRow('Logradouro', addr?.street)}
      {renderRow('Número', addr?.number)}
      {renderRow('Complemento', addr?.complement)}
      {renderRow('Bairro', addr?.neighborhood)}
      {renderRow('Cidade', addr?.city)}
      {renderRow('UF', addr?.state)}
    </>
  );

  if (loading) {
    return (
      <PageContainer title="Dossiê">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 48, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        </div>
      </PageContainer>
    );
  }

  if (!immigrant) {
    return (
      <PageContainer title="Dossiê">
        <EmptyState
          title="Imigrante não encontrado"
          description="O registro solicitado não existe ou foi removido."
          action={
            <Link to="/imigrantes">
              <Button>Voltar para lista</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dossiê">
      <Link to="/imigrantes" className={styles.backLink}>
        <ArrowLeft size={16} />
        Voltar para lista
      </Link>

      {/* Profile header */}
      <div className={styles.profile}>
        <Avatar name={immigrant.fullName} size="xl" />
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{immigrant.fullName}</h2>
          <div className={styles.profileMeta}>
            <span className={styles.profileMetaItem}>
              <Globe size={14} />
              {immigrant.nationality}
            </span>
            <span className={styles.profileMetaItem}>
              <MapPin size={14} />
              {immigrant.brazilAddress.city}, {immigrant.brazilAddress.state}
            </span>
            <span className={styles.profileMetaItem}>
              <Briefcase size={14} />
              {immigrant.occupation || 'Não informado'}
            </span>
            <span className={styles.profileMetaItem}>
              <Calendar size={14} />
              Entrada: {formatDate(immigrant.entryDate)}
            </span>
          </div>
        </div>
        <div className={styles.profileActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/imigrantes/${id}/editar`)}
          >
            <Pencil size={14} />
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'dados' ? styles.active : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          <User size={16} />
          Dados Pessoais
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'documentos' ? styles.active : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          <FileText size={16} />
          Documentos
          <span className={styles.tabCount}>{documents.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'historico' ? styles.active : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          <Clock size={16} />
          Histórico
          <span className={styles.tabCount}>{history.length}</span>
        </button>
      </div>

      {/* Tab content: Dados */}
      {activeTab === 'dados' && (
        <div className={styles.dataGrid}>
          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <User size={14} />
              Identificação
            </div>
            {renderRow('Nome completo', immigrant.fullName)}
            {renderRow('Nome da mãe', immigrant.motherName)}
            {renderRow('Nome do pai', immigrant.fatherName)}
            {renderRow('Data de nascimento', immigrant.birthDate && formatDate(immigrant.birthDate))}
            {renderRow('Estado civil', MARITAL_LABELS[immigrant.maritalStatus])}
            {renderRow('Idioma principal', immigrant.mainLanguage)}
            {renderRow('Ocupação principal', immigrant.occupation)}
            {renderRow('Data de cadastro', immigrant.createdAt && formatDateTime(immigrant.createdAt))}
          </div>

          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <FileText size={14} />
              Documentação
            </div>
            {renderRow('Status do CPF', optionLabel(CPF_STATUS_OPTIONS, immigrant.cpfStatus))}
            {renderRow('CPF', immigrant.cpf)}
            {renderRow(
              'Taxa do RNM paga',
              immigrant.rnmFeePaid === undefined ? undefined : immigrant.rnmFeePaid ? 'Sim' : 'Não'
            )}
            {renderRow(
              'Documento de viagem',
              optionLabel(TRAVEL_DOCUMENT_OPTIONS, immigrant.travelDocumentType)
            )}
            {renderRow('Nº do documento', immigrant.travelDocumentNumber)}
            {renderRow('País emissor', immigrant.travelDocumentIssuerCountry)}
          </div>

          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <Globe size={14} />
              Origem e Entrada
            </div>
            {renderRow('País de origem', immigrant.nationality)}
            {renderRow('Cidade de origem', immigrant.birthCity)}
            {renderRow('Data de entrada', immigrant.entryDate && formatDate(immigrant.entryDate))}
            {renderRow('Meio de entrada', ENTRY_MEANS_LABELS[immigrant.entryMeans])}
            {renderRow('Cidade de entrada', immigrant.entryCity)}
            {renderRow('UF de entrada', immigrant.entryState)}
          </div>

          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <Phone size={14} />
              Contato
            </div>
            {renderRow('E-mail', immigrant.email)}
            {renderRow('Telefone', immigrant.phone)}
          </div>

          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <MapPin size={14} />
              Endereço Residencial
            </div>
            {renderAddressRows(immigrant.brazilAddress)}
          </div>

          <div className={styles.dataCard}>
            <div className={styles.dataCardTitle}>
              <Briefcase size={14} />
              Endereço do Trabalho
            </div>
            {renderAddressRows(immigrant.workAddress)}
          </div>
        </div>
      )}

      {/* Tab content: Documentos */}
      {activeTab === 'documentos' && (
        <>
          <div className={styles.docsHeader}>
            <h3 className={styles.docsTitle}>Documentos ({documents.length})</h3>
            <Button size="sm" onClick={() => setDocModalOpen(true)}>
              <Plus size={14} />
              Adicionar Documento
            </Button>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              title="Nenhum documento"
              description="Adicione documentos vinculados a este imigrante."
              icon={<FileText size={48} />}
              action={
                <Button size="sm" onClick={() => setDocModalOpen(true)}>
                  <Plus size={14} />
                  Adicionar Documento
                </Button>
              }
            />
          ) : (
            <div className={styles.docsList}>
              {documents.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <div
                    className={styles.docIcon}
                    style={{ background: 'var(--tint-blue-bg)', color: 'var(--tint-blue-fg)' }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className={styles.docInfo}>
                    <div className={styles.docName}>{doc.name}</div>
                    <div className={styles.docMeta}>
                      <Badge variant="neutral">
                        {doc.typeCode !== undefined ? `Tipo ${doc.typeCode}` : DOC_TYPE_LABELS[doc.type]}
                      </Badge>
                      {' • '}
                      {formatDate(doc.uploadDate)}
                      {doc.sizeBytes !== undefined && ` • ${formatFileSize(doc.sizeBytes)}`}
                      {doc.expirationDate && ` • Exp: ${formatDate(doc.expirationDate)}`}
                    </div>
                    {doc.notes && <div className={styles.docNotes}>{doc.notes}</div>}
                  </div>
                  <div className={styles.docActions}>
                    <button
                      className={styles.docActionBtn}
                      onClick={() => handleDownloadDoc(doc)}
                      disabled={downloadingId === doc.id}
                      title="Baixar"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className={`${styles.docActionBtn} ${styles.danger}`}
                      onClick={() => handleRemoveDoc(doc.id)}
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Document Modal */}
          <Modal
            isOpen={docModalOpen}
            onClose={() => {
              setDocModalOpen(false);
              setNewDocFile(null);
            }}
            title="Adicionar Documento"
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDocModalOpen(false);
                    setNewDocFile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddDocument} loading={saving} disabled={!newDocFile}>
                  Adicionar
                </Button>
              </>
            }
          >
            <div className={styles.modalForm}>
              <Input
                label="Arquivo"
                type="file"
                required
                onChange={(e) =>
                  setNewDocFile((e.target as HTMLInputElement).files?.[0] ?? null)
                }
              />
              {newDocFile && (
                <div className={styles.docMeta}>
                  {newDocFile.name} • {formatFileSize(newDocFile.size)}
                </div>
              )}
            </div>
          </Modal>
        </>
      )}

      {/* Tab content: Histórico */}
      {activeTab === 'historico' && (
        <>
          <div className={styles.timelineHeader}>
            <h3 className={styles.docsTitle}>Histórico de Ações ({history.length})</h3>
            <Button size="sm" onClick={openNewHistoryModal}>
              <Plus size={14} />
              Registrar Ação
            </Button>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="Nenhum registro"
              description="Registre as ações realizadas para este imigrante."
              icon={<Clock size={48} />}
              action={
                <Button size="sm" onClick={openNewHistoryModal}>
                  <Plus size={14} />
                  Registrar Ação
                </Button>
              }
            />
          ) : (
            <div className={styles.timeline}>
              {history.map((entry) => {
                const config = HISTORY_TYPE_CONFIG[entry.type];
                const Icon = config.icon;
                return (
                  <div key={entry.id} className={styles.timelineItem}>
                    <div
                      className={styles.timelineDot}
                      style={{ background: config.bg, color: config.color }}
                    >
                      <Icon size={10} />
                    </div>
                    <div className={styles.timelineCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={styles.timelineTitle}>{config.label}</span>
                        <div className={styles.docActions} style={{ marginLeft: 'auto' }}>
                          <button
                            className={styles.docActionBtn}
                            onClick={() => openEditHistoryModal(entry)}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`${styles.docActionBtn} ${styles.danger}`}
                            onClick={() => handleRemoveHistory(entry.id)}
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className={styles.timelineDesc}>{entry.description}</p>
                      <div className={styles.timelineMeta}>
                        <span>{formatDateTime(entry.date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add History Modal */}
          <Modal
            isOpen={historyModalOpen}
            onClose={closeHistoryModal}
            title={editingHistoryId ? 'Editar Ação' : 'Registrar Ação'}
            footer={
              <>
                <Button variant="secondary" onClick={closeHistoryModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveHistory} loading={saving} disabled={!newHistory.description.trim()}>
                  {editingHistoryId ? 'Salvar' : 'Registrar'}
                </Button>
              </>
            }
          >
            <div className={styles.modalForm}>
              <Select
                label="Tipo de Ação"
                options={HISTORY_TYPE_OPTIONS}
                value={newHistory.type}
                onChange={(e) =>
                  setNewHistory((prev) => ({ ...prev, type: e.target.value as HistoryType }))
                }
              />
              <Input
                as="textarea"
                label="Ação"
                required
                value={newHistory.description}
                onChange={(e) =>
                  setNewHistory((prev) => ({
                    ...prev,
                    description: (e.target as HTMLTextAreaElement).value,
                  }))
                }
                placeholder="Descreva a ação realizada..."
              />
            </div>
          </Modal>
        </>
      )}
    </PageContainer>
  );
}
