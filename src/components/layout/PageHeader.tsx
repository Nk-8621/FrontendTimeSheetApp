import type { ReactNode } from 'react';
import { useSession } from '../../session/SessionContext';
import { useEmployee } from '../../hooks/api/useEmployees';
import { isAzureConfigured } from '../../auth/authConfig';
import { AzureUserBadge } from '../../auth/AzureUserBadge';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  crumb: string;
  title: string;
  children?: ReactNode; // top actions, rendered before the "who" block
}

export function PageHeader({ crumb, title, children }: PageHeaderProps) {
  const { employeeCode, roleLabel } = useSession();
  const { data: employee } = useEmployee(employeeCode);

  return (
    <header className={styles.topbar}>
      <div>
        <div className={styles.crumb}>{crumb}</div>
        <h2>{title}</h2>
      </div>
      <div className={styles.spacer} />
      {children}
      <div className={styles.who}>
        <div className={styles.avatar}>{employee?.initials ?? '…'}</div>
        <div>
          <div className={styles.nm}>{employee?.fullName ?? 'Loading…'}</div>
          <div className={styles.rl}>{roleLabel.split(' — ')[1]}</div>
        </div>
      </div>
      {isAzureConfigured() && <AzureUserBadge />}
    </header>
  );
}
