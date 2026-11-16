import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSession } from '../../session/SessionContext';
import { useUI } from '../ui/UIProvider';

export function AppLayout() {
  const { employeeCode } = useSession();
  const { closeDrawer } = useUI();
  const { pathname } = useLocation();

  // A drawer belongs to the page that opened it - close it when the user
  // goes to another page (changing the week on the same page keeps it open).
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

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
