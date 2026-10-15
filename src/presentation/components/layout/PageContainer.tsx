import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

const COLLAPSED_KEY = 'sidebar_collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function PageContainer({ title, children }: PageContainerProps) {
  // Each page mounts its own container, so the collapsed state is persisted to survive navigation
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1');
      } catch {
        // Storage unavailable: keep the in-memory state only
      }
      return !c;
    });
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <main
        className={`${styles.main} ${collapsed ? styles.collapsedSidebar : styles.expanded}`}
      >
        <Header
          title={title}
          sidebarCollapsed={collapsed}
          onMenuClick={() => setMobileOpen((o) => !o)}
        />
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
