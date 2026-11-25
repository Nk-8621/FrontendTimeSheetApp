import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from '../../session/SessionContext';
import { useEmployee } from '../../hooks/api/useEmployees';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  children?: ReactNode; // top actions, rendered before the "who" block
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { employeeCode, roleLabel, logout } = useSession();
  const { data: employee } = useEmployee(employeeCode);
  const [menuOpen, setMenuOpen] = useState(false);
  const whoRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on a click anywhere outside it, or on Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!whoRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={styles.topbar}>
      <h2>{title}</h2>
      <div className={styles.spacer} />
      {children}
      <div className={styles.whoWrap} ref={whoRef}>
        <button
          type="button"
          className={`${styles.who} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <span className={styles.avatar}>{employee?.initials ?? '…'}</span>
          <span className={styles.nm}>{employee?.fullName ?? 'Loading…'}</span>
          <span className={styles.caret} aria-hidden="true">{menuOpen ? '▴' : '▾'}</span>
        </button>
        {menuOpen && (
          <div className={styles.menu}>
            <div className={styles.menuInfo}>
              <div className={styles.menuDesig}>{employee?.designation ?? roleLabel.split(' — ')[1]}</div>
              <div className={styles.menuId}>{employeeCode}</div>
            </div>
            <div className={styles.menuFoot}>
              <button type="button" className={styles.signOut} onClick={logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
