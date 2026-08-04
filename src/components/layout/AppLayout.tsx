import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSession } from '../../session/SessionContext';

export function AppLayout() {
  const { employeeCode } = useSession();

  return (
    <div className="app-shell">
      <Sidebar />
      {/* key={employeeCode} forces a full remount of everything under here
          when the viewing identity changes, so no page can ever show a
          previous identity's stale data — regardless of route/cache timing. */}
      <div className="main-column" key={employeeCode}>
        <Outlet />
      </div>
    </div>
  );
}
