import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  sub?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
}

export function Card({ title, sub, headerRight, children, noPad }: CardProps) {
  return (
    <div className={styles.card}>
      {title && (
        <div className={styles.cardHd}>
          <h3>{title}</h3>
          {sub && <span className={styles.sub}>{sub}</span>}
          <div style={{ flex: 1 }} />
          {headerRight}
        </div>
      )}
      <div className={noPad ? undefined : styles.cardBd}>{children}</div>
    </div>
  );
}
