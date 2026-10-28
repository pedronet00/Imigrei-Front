import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Users,
  Globe2,
  MapPin,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  X,
  FileCheck2,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { Pagination } from '../../components/ui/Pagination';
import type { Immigrant } from '../../../domain/entities/Immigrant';
import { useImmigrants } from '../../contexts/ImmigrantContext';
import { useToast } from '../../components/ui/Toast';
import styles from './ImmigrantList.module.css';

export function ImmigrantList() {
  const navigate = useNavigate();
  const { immigrants, loading, error, refresh, remove } = useImmigrants();
  const { showToast } = useToast();

  const getRowActions = (immigrant: Immigrant) => [
    {
      label: 'Ver dossiê',
      icon: <Eye size={14} />,
      onSelect: () => navigate(`/imigrantes/${immigrant.id}`),
    },
    {
      label: 'Editar',
      icon: <Pencil size={14} />,
      onSelect: () => navigate(`/imigrantes/${immigrant.id}/editar`),
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      danger: true,
      onSelect: () => handleDelete(immigrant.id, immigrant.fullName),
    },
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const countries = useMemo(() => {
    const unique = [...new Set(immigrants.map((i) => i.nationality).filter(Boolean))].sort();
    return unique;
  }, [immigrants]);

  const filtered = useMemo(() => {
    let list = immigrants;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.fullName.toLowerCase().includes(q) ||
          (i.cpf && i.cpf.includes(q)) ||
          (i.email && i.email.toLowerCase().includes(q)) ||
          (i.phone && i.phone.includes(q)) ||
          (i.brazilAddress?.city && i.brazilAddress.city.toLowerCase().includes(q))
      );
    }

    if (filterCountry) {
      list = list.filter((i) => i.nationality === filterCountry);
    }

    return list;
  }, [immigrants, searchQuery, filterCountry]);

  // Mantém a página válida quando a lista encolhe (ex.: ao excluir o último item da página)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCountryChange = (value: string) => {
    setFilterCountry(value);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const pagination = (
    <Pagination
      page={currentPage}
      pageSize={pageSize}
      totalItems={filtered.length}
      onPageChange={setPage}
      onPageSizeChange={handlePageSizeChange}
    />
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir ${name}?`)) {
      await remove(id);
      showToast('success', 'Imigrante excluído', `${name} foi removido com sucesso.`);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  return (
    <PageContainer title="Gestão de Imigrantes">
      {/* Stats Summary Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.blue}`}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{immigrants.length}</span>
            <span className={styles.statLabel}>Total Cadastrados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.purple}`}>
            <Globe2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{countries.length}</span>
            <span className={styles.statLabel}>Países de Origem</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.emerald}`}>
            <FileCheck2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {immigrants.filter((i) => i.cpf).length}
            </span>
            <span className={styles.statLabel}>CPFs Registrados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.amber}`}>
            <MapPin size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {[...new Set(immigrants.map((i) => i.brazilAddress?.state).filter(Boolean))].length}
            </span>
            <span className={styles.statLabel}>Estados (UFs)</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard} style={{ marginTop: 24 }}>
        <div className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nome, CPF, cidade ou e-mail..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearSearch}
                onClick={() => handleSearchChange('')}
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterControls}>
          <select
            className={styles.filterSelect}
            value={filterCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            <option value="">Todas as nacionalidades ({countries.length})</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela"
            >
              <ListIcon size={18} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visualização em Cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <Link to="/imigrantes/novo">
            <Button size="md">
              <Plus size={16} />
              Novo Cadastro
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={styles.tableCard}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 60, margin: '12px 16px', borderRadius: 8 }}
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Erro ao carregar imigrantes"
          description={error}
          action={
            <Button variant="secondary" onClick={() => refresh()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum imigrante encontrado"
          description={
            searchQuery || filterCountry
              ? 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar os parâmetros.'
              : 'Nenhum imigrante foi cadastrado até o momento.'
          }
          action={
            searchQuery || filterCountry ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCountry('');
                  setPage(1);
                }}
              >
                Limpar Filtros
              </Button>
            ) : (
              <Link to="/imigrantes/novo">
                <Button>
                  <Plus size={16} />
                  Novo Cadastro
                </Button>
              </Link>
            )
          }
        />
      ) : viewMode === 'table' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome / Contato</th>
                  <th>Nacionalidade</th>
                  <th>CPF</th>
                  <th>Localização (Brasil)</th>
                  <th>Data de Entrada</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((immigrant) => (
                  <tr key={immigrant.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <Avatar name={immigrant.fullName} size="md" />
                        <div className={styles.nameText}>
                          <span className={styles.fullName}>{immigrant.fullName}</span>
                          <span className={styles.email}>
                            {immigrant.email || immigrant.phone || 'Sem e-mail'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="info">{immigrant.nationality || 'Não informada'}</Badge>
                    </td>
                    <td>
                      {immigrant.cpf ? (
                        <span className={styles.cpfBadge}>{immigrant.cpf}</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                          Pendente
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.locationCell}>
                        <MapPin size={14} className={styles.locationIcon} />
                        <span>
                          {immigrant.brazilAddress?.city || immigrant.entryCity || '-'}{' '}
                          {immigrant.brazilAddress?.state
                            ? `/${immigrant.brazilAddress.state}`
                            : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={14} className={styles.dateIcon} />
                        <span>{formatDate(immigrant.entryDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <DropdownMenu
                          label={`Ações para ${immigrant.fullName}`}
                          items={getRowActions(immigrant)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>{pagination}</div>
        </div>
      ) : (
        /* Grid Mode */
        <>
          <div className={styles.gridContainer}>
          {paginated.map((immigrant) => (
            <div key={immigrant.id} className={styles.cardItem}>
              <div className={styles.cardHeader}>
                <div className={styles.cardUser}>
                  <Avatar name={immigrant.fullName} size="md" />
                  <div className={styles.nameText}>
                    <span className={styles.fullName}>{immigrant.fullName}</span>
                    <span className={styles.email}>{immigrant.email || 'Sem e-mail'}</span>
                  </div>
                </div>
                <Badge variant="info">{immigrant.nationality}</Badge>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardBodyRow}>
                  <span>CPF:</span>
                  <strong>{immigrant.cpf || 'Pendente'}</strong>
                </div>
                <div className={styles.cardBodyRow}>
                  <span>Cidade / UF:</span>
                  <strong>
                    {immigrant.brazilAddress?.city || '-'}{' '}
                    {immigrant.brazilAddress?.state ? `(${immigrant.brazilAddress.state})` : ''}
                  </strong>
                </div>
                <div className={styles.cardBodyRow}>
                  <span>Data de Entrada:</span>
                  <strong>{formatDate(immigrant.entryDate)}</strong>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/imigrantes/${immigrant.id}`)}
                >
                  <Eye size={14} /> Dossiê
                </Button>
                <div className={styles.actions}>
                  <DropdownMenu
                    label={`Ações para ${immigrant.fullName}`}
                    items={getRowActions(immigrant)}
                  />
                </div>
              </div>
            </div>
          ))}
          </div>
          <div className={`${styles.tableCard} ${styles.tableFooter}`} style={{ marginTop: 20 }}>
            {pagination}
          </div>
        </>
      )}
    </PageContainer>
  );
}
