import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSession } from '../../session/SessionContext';
import { useUI } from '../ui/UIProvider';

export function AppLayout() {
  const { employeeCode } = useSession();
  const { closeDrawer } = useUI();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Small screens only: the sidebar slides in over the page.
  const [navOpen, setNavOpen] = useState(false);

  // A drawer belongs to the page that opened it - close it when the user
  // goes to another page (changing the week on the same page keeps it open).
  useEffect(() => {
    closeDrawer();
    setNavOpen(false);
  }, [pathname, closeDrawer]);

  // Esc, when nothing is open (calendars, menus, confirm boxes, drawers and
  // expanded rows all handle Esc first and mark it handled): leave a text
  // field if typing in one, otherwise go back to the previous screen - only
  // within the app, never off-site.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) {
        el.blur();
        return;
      }
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
      if (idx > 0) {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <TopBar onMenu={() => setNavOpen(true)} />
      {/* key={employeeCode} forces a full remount of everything under here
          when the viewing identity changes, so no page can ever show a
          previous identity's stale data — regardless of route/cache timing. */}
      <div className="main-column" key={employeeCode}>
        <Outlet />
      </div>
    </div>
  );
}
