import { useEffect } from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { Link, NavLink } from 'react-router-dom';
import { NAV_GROUPS } from '../../types/meridian';
import { useSession } from '../../session/SessionContext';
import { usePendingApprovals } from '../../hooks/api/useApprovals';
import { useNotifications } from '../../hooks/api/useNotifications';
import { Icon, PAGE_ICON } from '../ui/Icon';
import styles from './Sidebar.module.css';

const pathFor = (key: string) => `/${key === 'ts' ? '' : key}`;

interface SidebarProps {
  /** Small screens: whether the slide-in sidebar is showing. */
  open: boolean;
  onClose: () => void;
  /** SLIDING NAV (trial): icon-only rail that slides open on hover. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** Grouped sidebar: every page the user can reach (same nav keys from the
 * access profile as before), under its group heading, with pending counts. */
export function Sidebar({ open, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { nav } = useSession();

  const { data: pendingL1 } = usePendingApprovals(false, nav.includes('ap1'));
  const { data: pendingL2 } = usePendingApprovals(true, nav.includes('ap2'));
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isBroadcast && !n.readAt).length ?? 0;

  // Groups in the order the backend's nav keys arrive; unknown keys skipped.
  const groups: Record<string, string[]> = {};
  nav.forEach((key) => {
    const group = NAV_GROUPS[key]?.group;
    if (!group) return;
    (groups[group] = groups[group] ?? []).push(key);
  });

  const badgeFor = (key: string) => {
    if (key === 'ap1') return pendingL1?.length ?? 0;
    if (key === 'ap2') return pendingL2?.length ?? 0;
    if (key === 'notif') return unreadCount;
    return 0;
  };

  // Esc closes the slide-in sidebar.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div className={`${styles.scrim} ${open ? styles.scrimOn : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`${styles.side} ${open ? styles.open : ''} ${collapsed ? styles.collapsed : ''}`} aria-label="Main navigation">
        <Link to="/" className={styles.brand} aria-label="Carbynetech Timesheet - home">
          <BrandLogo className={styles.logoTile} />
        </Link>

        <nav className={styles.nav}>
          {Object.entries(groups).map(([group, keys]) => (
            <div key={group} className={styles.section}>
              <div className={styles.label}>{group}</div>
              {keys.map((key) => {
                const badge = badgeFor(key);
                return (
                  <NavLink
                    key={key}
                    to={pathFor(key)}
                    end={key === 'ts'}
                    className={({ isActive }) => `${styles.item} ${isActive ? styles.on : ''}`}
                    title={collapsed ? NAV_GROUPS[key].title : undefined}
                  >
                    <Icon name={PAGE_ICON[key]} />
                    <span className={styles.txt}>{NAV_GROUPS[key].title}</span>
                    {badge > 0 && <span className={styles.count}>{badge > 99 ? '99+' : badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {onToggleCollapse && (
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title={collapsed ? 'Keep menu open' : 'Collapse menu'}
            aria-label={collapsed ? 'Keep menu open' : 'Collapse menu'}
            aria-pressed={collapsed}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
            <span className={styles.txt}>{collapsed ? 'Keep menu open' : 'Collapse menu'}</span>
          </button>
        )}
      </aside>
    </>
  );
}
