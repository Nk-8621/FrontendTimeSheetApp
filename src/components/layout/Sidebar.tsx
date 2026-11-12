import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../../types/meridian';
import { useSession } from '../../session/SessionContext';
import { usePendingApprovals } from '../../hooks/api/useApprovals';
import { useNotifications } from '../../hooks/api/useNotifications';
import styles from './Sidebar.module.css';

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** One icon per rail group (NAV_GROUPS[key].group). */
const GROUP_ICONS: Record<string, ReactNode> = {
  'My Work': svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>),
  Approvals: svg(<><circle cx="12" cy="12" r="9" /><polyline points="8 12.5 11 15.5 16 9.5" /></>),
  Oversight: svg(<><line x1="5" y1="20" x2="5" y2="11" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="19" y1="20" x2="19" y2="14" /><line x1="3" y1="20" x2="21" y2="20" /></>),
  Setup: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  Notifications: svg(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
};

/** Pinned to the bottom of the rail, like an inbox. */
const FOOTER_GROUP = 'Notifications';

const pathFor = (key: string) => `/${key === 'ts' ? '' : key}`;

export function Sidebar() {
  const { nav } = useSession();
  const { pathname } = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const railRef = useRef<HTMLElement>(null);

  const { data: pendingL1 } = usePendingApprovals(false, nav.includes('ap1'));
  const { data: pendingL2 } = usePendingApprovals(true, nav.includes('ap2'));
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isBroadcast && !n.readAt).length ?? 0;

  // Groups in the order the backend's nav keys arrive. Unknown keys are
  // skipped rather than crashing the whole rail.
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

  const isActive = (key: string) => (key === 'ts' ? pathname === '/' : pathname.startsWith(pathFor(key)));

  // Close the flyout after navigating, on Esc, or on a click outside the rail.
  useEffect(() => setOpenGroup(null), [pathname]);
  useEffect(() => {
    if (!openGroup) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!railRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openGroup]);

  const renderGroup = (group: string, keys: string[]) => {
    const total = keys.reduce((n, key) => n + badgeFor(key), 0);
    const active = keys.some(isActive);
    const cls = `${styles.grpBtn} ${active ? styles.on : ''}`;
    const inner = (
      <>
        {GROUP_ICONS[group]}
        <span>{group}</span>
        {total > 0 && <b className={styles.badge}>{total}</b>}
      </>
    );

    // A group with a single page for this user goes straight there.
    if (keys.length === 1) {
      return (
        <div key={group} className={styles.grp}>
          <NavLink to={pathFor(keys[0])} end={keys[0] === 'ts'} className={cls} title={NAV_GROUPS[keys[0]].title}>
            {inner}
          </NavLink>
        </div>
      );
    }

    const open = openGroup === group;
    return (
      <div
        key={group}
        className={styles.grp}
        onMouseEnter={() => setOpenGroup(group)}
        onMouseLeave={() => setOpenGroup((g) => (g === group ? null : g))}
      >
        <button
          type="button"
          className={`${cls} ${open ? styles.open : ''}`}
          // Open, not toggle: with a mouse, hovering has already opened it, so
          // a toggle would close it again on the same click. Touch users close
          // it by tapping elsewhere (or picking a page).
          onClick={() => setOpenGroup(group)}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {inner}
        </button>
        {open && (
          <div className={styles.fly}>
            <div className={styles.flyHd}>{group}</div>
            {keys.map((key) => {
              const badge = badgeFor(key);
              return (
                <NavLink
                  key={key}
                  to={pathFor(key)}
                  end={key === 'ts'}
                  className={({ isActive: on }) => `${styles.flyItem} ${on ? styles.cur : ''}`}
                >
                  {NAV_GROUPS[key].title}
                  {badge > 0 && <span className={styles.cnt}>{badge}</span>}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const entries = Object.entries(groups);
  return (
    <aside className={styles.rail} ref={railRef}>
      <div className={styles.brand}>
        <img src="/apple-touch-icon.png" alt="Carbynetech" />
      </div>

      <nav className={styles.railNav}>
        {entries.filter(([group]) => group !== FOOTER_GROUP).map(([group, keys]) => renderGroup(group, keys))}
      </nav>

      {groups[FOOTER_GROUP] && (
        <div className={styles.railFoot}>{renderGroup(FOOTER_GROUP, groups[FOOTER_GROUP])}</div>
      )}
    </aside>
  );
}
