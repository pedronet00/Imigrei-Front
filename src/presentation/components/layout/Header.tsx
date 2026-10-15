import { Link } from 'react-router-dom';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({ title, sidebarCollapsed, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <header
      className={`${styles.header} ${sidebarCollapsed ? styles.collapsedSidebar : styles.expanded}`}
    >
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          title={themeLabel}
          aria-label={themeLabel}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link to="/minha-conta" className={styles.userInfo} title="Minha conta">
          <div className={styles.userDetails}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
          <Avatar name={user?.name || 'U'} size="sm" />
        </Link>
        <button
          className={styles.logoutBtn}
          onClick={logout}
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
