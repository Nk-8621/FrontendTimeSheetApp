import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContext';

interface ProtectedRouteProps {
  /** The NAV_GROUPS key this route corresponds to (e.g. 'ap1', 'mast'). */
  navKey: string;
  children: ReactNode;
}

/** Blocks access to a route unless the current role's nav list includes it —
 * closes the gap where hiding a sidebar link didn't actually prevent
 * navigating to the URL directly.
 *
 * Waits for the real access profile to finish loading before making that
 * call — the fallback nav shown during loading is deliberately minimal
 * (see SessionContext), so treating "still loading" the same as "not
 * permitted" would cause a spurious redirect on every page load, before
 * flashing back once the real profile arrives. That flash was also
 * stripping query strings like ?week=... off the URL. */
export function ProtectedRoute({ navKey, children }: ProtectedRouteProps) {
  const { nav, isLoading } = useSession();
  if (isLoading) return null;
  if (!nav.includes(navKey)) return <Navigate to="/" replace />;
  return <>{children}</>;
}