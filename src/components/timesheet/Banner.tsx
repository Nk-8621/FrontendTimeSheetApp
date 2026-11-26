import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import styles from './Banner.module.css';

interface BannerProps {
  kind?: 'info' | 'warn' | 'reject';
  children: ReactNode;
}

const KIND_CLASS: Record<string, string> = { warn: styles.w, reject: styles.r };
const KIND_ICON: Record<string, string> = { info: 'info', warn: 'alert', reject: 'xCircle' };

export function Banner({ kind = 'info', children }: BannerProps) {
  return (
    <div className={`${styles.banner} ${KIND_CLASS[kind] ?? ''}`} role={kind === 'info' ? 'status' : 'alert'}>
      <Icon name={KIND_ICON[kind] ?? 'info'} className={styles.icon} />
      <div className={styles.text}>{children}</div>
    </div>
  );
}
