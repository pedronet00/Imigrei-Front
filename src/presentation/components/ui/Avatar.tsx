import { useMemo } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  photoUrl?: string;
}

const COLORS = ['blue', 'green', 'amber', 'pink', 'indigo', 'teal', 'red', 'violet'].map((hue) => ({
  bg: `var(--tint-${hue}-bg)`,
  text: `var(--tint-${hue}-fg)`,
}));

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

export function Avatar({ name, size = 'md', photoUrl }: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const color = useMemo(() => COLORS[getColorIndex(name)], [name]);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${styles.avatar} ${styles[size]}`}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ background: color.bg, color: color.text }}
      title={name}
    >
      {initials}
    </div>
  );
}
