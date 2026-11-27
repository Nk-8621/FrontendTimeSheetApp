import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../../types/meridian';
import { useSession } from '../../session/SessionContext';
import { useEmployee } from '../../hooks/api/useEmployees';
import { useNotifications } from '../../hooks/api/useNotifications';
import { applyAccent, applyTheme, getAccent, getTheme, type Accent, type Theme } from '../../lib/theme';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import styles from './TopBar.module.css';

type SubMenu = 'display' | 'color' | null;

const pathFor = (key: string) => `/${key === 'ts' ? '' : key}`;

const ACCENTS: { key: Accent; label: string; swatch: string }[] = [
  { key: 'purple', label: 'Purple', swatch: '#7C5CFC' },
  { key: 'teal', label: 'Carbynetech teal', swatch: '#1FA9B5' },
  { key: 'blue', label: 'Blue', swatch: '#2E6BEF' },
];

/** Header row above the page panel: breadcrumb (section › page), the
 * notifications bell and the profile menu. Uses only existing data (the
 * signed-in employee) and existing actions (notifications page, sign out);
 * Display mode / Theme color are purely visual preferences. */
export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { employeeCode, roleLabel, nav, logout } = useSession();
  const { pathname } = useLocation();
  const { data: employee } = useEmployee(employeeCode);
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.isBroadcast && !n.readAt).length ?? 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [sub, setSub] = useState<SubMenu>(null);
  const [theme, setTheme] = useState<Theme>(getTheme);
  const [accent, setAccent] = useState<Accent>(getAccent);
  const whoRef = useRef<HTMLDivElement>(null);

  const currentKey = Object.keys(NAV_GROUPS).find((key) => (key === 'ts' ? pathname === '/' : pathname.startsWith(pathFor(key))));
  const crumb = currentKey ? NAV_GROUPS[currentKey] : undefined;
  // Breadcrumb section links to the first page of that section the user can open.
  const groupHome = crumb ? nav.find((k) => NAV_GROUPS[k]?.group === crumb.group) : undefined;

  // Browser tab title follows the page (useful with several tabs / history).
  useEffect(() => {
    document.title = crumb ? `${crumb.title} · Carbynetech Timesheet` : 'Carbynetech Timesheet';
  }, [crumb]);

  // Close the profile menu on a click anywhere outside it, or on Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!whoRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) setSub(null);
  }, [menuOpen]);

  const pickTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
  };
  const pickAccent = (a: Accent) => {
    applyAccent(a);
    setAccent(a);
  };

  const designation = employee?.designation ?? roleLabel.split(' — ')[1];
  const initials = employee?.initials ?? '…';

  return (
    <header className={styles.bar}>
      <button type="button" className={`${styles.iconBtn} ${styles.menuBtn}`} onClick={onMenu} aria-label="Open navigation">
        <Icon name="menu" />
      </button>

      <Link to="/" className={styles.mLogo} aria-label="Carbynetech Timesheet - home">
        <BrandLogo className={styles.mLogoImg} />
      </Link>

      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Icon name="grid" className={styles.crumbIcon} />
        {!crumb && <span className={styles.crumbPage}>Page not found</span>}
        {crumb && (groupHome && groupHome !== currentKey
          ? <Link to={pathFor(groupHome)} className={`${styles.crumbGroup} ${styles.crumbLink}`}>{crumb.group}</Link>
          : <span className={styles.crumbGroup}>{crumb.group}</span>)}
        {crumb && crumb.group !== crumb.title && (
          <>
            <Icon name="chevronRight" className={styles.crumbSep} />
            <span className={styles.crumbPage} aria-current="page">{crumb.title}</span>
          </>
        )}
      </nav>

      <div className={styles.spacer} />

      {nav.includes('notif') && (
        <Link to="/notif" className={styles.iconBtn} title="Notifications" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <Icon name="bell" />
          {unread > 0 && <b className={styles.dot}>{unread > 99 ? '99+' : unread}</b>}
        </Link>
      )}

      <div className={styles.whoWrap} ref={whoRef}>
        <button
          type="button"
          className={`${styles.who} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={employee?.fullName}
        >
          <Avatar className={styles.avatar} employeeCode={employeeCode} initials={initials} name={employee?.fullName} />
        </button>

        {menuOpen && (
          <div className={styles.menu} role="menu">
            <div className={styles.menuInfo}>
              <Avatar className={styles.menuAvatar} employeeCode={employeeCode} initials={initials} name={employee?.fullName} />
              <div className={styles.menuWho}>
                <div className={styles.menuName}>{employee?.fullName ?? 'Loading…'}</div>
                {designation && <div className={styles.menuDesig}>{designation}</div>}
                <div className={styles.menuId}>{employeeCode}</div>
              </div>
            </div>

            <div className={styles.menuList}>
              <button
                type="button"
                role="menuitem"
                className={`${styles.item} ${sub === 'display' ? styles.itemOpen : ''}`}
                onClick={() => setSub((s) => (s === 'display' ? null : 'display'))}
                aria-expanded={sub === 'display'}
              >
                <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
                <span>Display mode</span>
                <Icon name="chevronRight" className={styles.chev} />
              </button>
              {sub === 'display' && (
                <div className={styles.subList}>
                  {(['light', 'dark'] as Theme[]).map((t) => (
                    <button key={t} type="button" role="menuitemradio" aria-checked={theme === t} className={styles.subItem} onClick={() => pickTheme(t)}>
                      <span>{t === 'light' ? 'Light' : 'Dark'}</span>
                      {theme === t && <Icon name="check" />}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                role="menuitem"
                className={`${styles.item} ${sub === 'color' ? styles.itemOpen : ''}`}
                onClick={() => setSub((s) => (s === 'color' ? null : 'color'))}
                aria-expanded={sub === 'color'}
              >
                <Icon name="palette" />
                <span>Theme color</span>
                <Icon name="chevronRight" className={styles.chev} />
              </button>
              {sub === 'color' && (
                <div className={styles.subList}>
                  {ACCENTS.map((a) => (
                    <button key={a.key} type="button" role="menuitemradio" aria-checked={accent === a.key} className={styles.subItem} onClick={() => pickAccent(a.key)}>
                      <span className={styles.swatchRow}>
                        <i className={styles.swatch} style={{ background: a.swatch }} />
                        {a.label}
                      </span>
                      {accent === a.key && <Icon name="check" />}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.sep} />
              <button type="button" role="menuitem" className={`${styles.item} ${styles.danger}`} onClick={logout}>
                <Icon name="logout" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
