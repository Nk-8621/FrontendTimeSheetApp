import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  /** One-line context under the title (e.g. the selected week). */
  subtitle?: ReactNode;
  children?: ReactNode; // page actions, shown on the right of the title
}

/** Top of the page panel: title + subtitle on the left, page actions on the
 * right (like the reference's "Good morning" block). Navigation between
 * pages lives in the sidebar and the breadcrumb. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className={styles.head}>
      <div className={styles.titles}>
        <h1>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
