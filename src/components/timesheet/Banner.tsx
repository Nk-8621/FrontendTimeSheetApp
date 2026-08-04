import type { ReactNode } from 'react';
import styles from './Banner.module.css';

interface BannerProps {
  kind?: 'info' | 'warn' | 'reject';
  children: ReactNode;
}

const KIND_CLASS: Record<string, string> = { warn: styles.w, reject: styles.r };

export function Banner({ kind = 'info', children }: BannerProps) {
  return <div className={`${styles.banner} ${KIND_CLASS[kind] ?? ''}`}>{children}</div>;
}
