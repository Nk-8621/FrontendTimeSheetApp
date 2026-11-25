import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
/** The index route ("/") is My Timesheet, which only people who fill a
 * timesheet have (nav key 'ts'). Senior leadership (see
 * AccessControlService.GetAccessProfileAsync) doesn't - send them to the
 * first screen they do have instead of an empty timesheet. Query strings
 * like ?week=... are kept for the people who stay here. */
export function HomeRoute({ children }: { children: ReactNode }) {
  const { nav, isLoading } = useSession();
  const { search } = useLocation();
  if (isLoading) return null;
  if (!nav.includes('ts') && nav.length > 0) return <Navigate to={`/${nav[0]}`} replace />;

  // LANDING PAGE (Nov 2026): User Stories is the landing page for now.
  // Only the first visit in a browser tab is sent there - after that "/"
  // opens My Timesheet as usual (sidebar link, View Timesheet, refresh).
  // Links that carry a week (?week=...) always open My Timesheet.
  if (nav.includes('stories') && !search && !hasLanded()) {
    markLanded();
    return <Navigate to="/stories" replace />;
  }
  markLanded();
  return <>{children}</>;
}

const LANDED_KEY = 'timesheet.landed';

function hasLanded() {
  try {
    return sessionStorage.getItem(LANDED_KEY) === '1';
  } catch {
    return true; // storage blocked - just stay on My Timesheet
  }
}

function markLanded() {
  try {
    sessionStorage.setItem(LANDED_KEY, '1');
  } catch {
    // storage blocked - nothing to remember
  }
}

export function ProtectedRoute({ navKey, children }: ProtectedRouteProps) {
  const { nav, isLoading } = useSession();
  if (isLoading) return null;
  if (!nav.includes(navKey)) return <Navigate to="/" replace />;
  markLanded(); // already on a screen - "/" now opens My Timesheet, not the landing page
  return <>{children}</>;
}
