import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  label?: string;
}

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

export function DropdownMenu({ items, label = 'Ações' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Rendered in a portal with fixed positioning so scroll/overflow containers don't clip it
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();

    let top = trigger.bottom + MENU_GAP;
    if (top + menu.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = trigger.top - menu.height - MENU_GAP;
    }
    const left = Math.max(VIEWPORT_MARGIN, trigger.right - menu.width);

    setPosition({ top: Math.max(VIEWPORT_MARGIN, top), left });
    menuRef.current.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const handleDismiss = () => close();

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [open, close]);

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const menuItems: HTMLButtonElement[] = menuRef.current
      ? Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
      : [];
    const index = menuItems.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      menuItems[(index + 1) % menuItems.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      menuItems[(index - 1 + menuItems.length) % menuItems.length]?.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={styles.menu}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            onKeyDown={handleMenuKeyDown}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
