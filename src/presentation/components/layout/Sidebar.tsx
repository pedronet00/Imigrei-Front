import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  UserCog,
  CircleUser,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
      { to: '/imigrantes', label: 'Imigrantes', icon: Users, end: true },
      // { to: '/imigrantes/novo', label: 'Novo cadastro', icon: UserPlus },
    ],
  },
  // {
  //   label: 'Acompanhamento',
  //   items: [
  //     { to: '/atendimentos', label: 'Atendimentos', icon: MessagesSquare, soon: true },
  //     { to: '/documentos', label: 'Documentos', icon: FolderOpen, soon: true },
  //   ],
  // },
  {
    label: 'Análise',
    items: [{ to: '/relatorios', label: 'Relatórios', icon: FileBarChart }],
  },
  {
    label: 'Administração',
    items: [
      { to: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
      { to: '/minha-conta', label: 'Minha conta', icon: CircleUser },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          I
        </span>
        <span className={styles.brandName}>Imigrantes</span>
      </div>

      <nav className={styles.nav} aria-label="Menu principal">
        {NAV_SECTIONS.map((section, idx) => {
          const items = section.items.filter((item) => !item.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={section.label ?? idx} className={styles.section}>
              {section.label && <div className={styles.sectionLabel}>{section.label}</div>}
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                >
                  <item.icon size={17} strokeWidth={1.75} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                  {item.soon && <span className={styles.soon}>em breve</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          <span className={styles.label}>Recolher</span>
        </button>
      </div>
    </aside>
  );
}
