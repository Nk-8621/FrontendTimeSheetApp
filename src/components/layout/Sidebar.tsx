import { NavLink } from 'react-router-dom';
import { NAV_GROUPS } from '../../types/meridian';
import { useSession } from '../../session/SessionContext';
import { usePendingApprovals } from '../../hooks/api/useApprovals';
import { useNotifications } from '../../hooks/api/useNotifications';
import { useUI } from '../ui/UIProvider';
import { ChangePasswordDrawer } from '../auth/ChangePasswordDrawer';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { employeeCode, roleLabel, nav, logout } = useSession();
  const { openDrawer, closeDrawer, toast } = useUI();

  const { data: pendingL1 } = usePendingApprovals(false);
  const { data: pendingL2 } = usePendingApprovals(true);
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isBroadcast && !n.readAt).length ?? 0;

  const groups: Record<string, string[]> = {};
  nav.forEach((key) => {
    const group = NAV_GROUPS[key].group;
    (groups[group] = groups[group] ?? []).push(key);
  });

  const badgeFor = (key: string) => {
    if (key === 'ap1') return pendingL1?.length || '';
    if (key === 'ap2') return pendingL2?.length || '';
    if (key === 'notif') return unreadCount || '';
    return '';
  };

  function handleChangePassword() {
    openDrawer({
      title: 'Change password',
      body: (
        <ChangePasswordDrawer
          onCancel={closeDrawer}
          onSuccess={() => { closeDrawer(); toast('Password changed', 'ok'); }}
        />
      ),
    });
  }

  return (
    <aside className={styles.rail}>
      <div className={styles.brand}>
        <h1>CARBYNETECH</h1>
        <div className={styles.tag}>TIMESHEET</div>
      </div>

      <div className={styles.railScroll}>
        {Object.entries(groups).map(([group, keys]) => (
          <div key={group}>
            <div className={styles.navGroup}>{group}</div>
            {keys.map((key) => {
              const badge = badgeFor(key);
              return (
                <NavLink
                  key={key}
                  to={`/${key === 'ts' ? '' : key}`}
                  end={key === 'ts'}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.on : ''}`}
                >
                  <span className={styles.ic}>{NAV_GROUPS[key].icon}</span>
                  {NAV_GROUPS[key].title}
                  {badge !== '' && <span className={styles.cnt}>{badge}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.railFoot}>
        <div className={styles.lbl}>Signed in as</div>
        <div style={{ fontSize: 11.5, color: '#fff', fontWeight: 600, marginBottom: 1 }}>{roleLabel}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{employeeCode}</div>
        <button
          onClick={handleChangePassword}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '7px 0', cursor: 'pointer',
            marginBottom: 6,
          }}
        >
          Change password
        </button>
        <button
          onClick={logout}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 6, color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '7px 0', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}