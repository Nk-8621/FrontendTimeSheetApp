import { NavLink, useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '../../types/meridian';
import { DEMO_IDENTITIES, useSession } from '../../session/SessionContext';
import { usePendingApprovals } from '../../hooks/api/useApprovals';
import type { RoleId } from '../../types/meridian';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { roleId, nav, setRoleId } = useSession();
  const navigate = useNavigate();

  const { data: pendingL1 } = usePendingApprovals(false);
  const { data: pendingL2 } = usePendingApprovals(true);

  const groups: Record<string, string[]> = {};
  nav.forEach((key) => {
    const group = NAV_GROUPS[key].group;
    (groups[group] = groups[group] ?? []).push(key);
  });

  const badgeFor = (key: string) => {
    if (key === 'ap1') return pendingL1?.length || '';
    if (key === 'ap2') return pendingL2?.length || '';
    return '';
  };

  function handleRoleChange(id: RoleId) {
    setRoleId(id);
    navigate('/');
  }

  return (
    <aside className={styles.rail}>
      <div className={styles.brand}>
        <h1>CARBYNETECH</h1>
        <div className={styles.tag}>Timesheet</div>
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
        <div className={styles.lbl}>Viewing as</div>
        <select value={roleId} onChange={(e) => handleRoleChange(e.target.value as RoleId)}>
          {DEMO_IDENTITIES.map((i) => (
            <option key={i.roleId} value={i.roleId}>
              {i.roleLabel}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
