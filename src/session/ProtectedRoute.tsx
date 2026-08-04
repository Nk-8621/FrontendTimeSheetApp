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
 * navigating to the URL directly. */
export function ProtectedRoute({ navKey, children }: ProtectedRouteProps) {
  const { nav } = useSession();
  if (!nav.includes(navKey)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
