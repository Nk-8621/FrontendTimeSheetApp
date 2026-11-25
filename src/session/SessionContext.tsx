import { createContext, useContext, useState, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { getStoredAuth, clearStoredAuth, setAccessTokenGetter } from '../api/authBridge';
import { useAccessProfile, useEmployee } from '../hooks/api/useEmployees';

const FALLBACK_NAV = ['notif']; // shown only while the access profile is still loading

interface SessionValue {
  employeeCode: string;
  /** The current employee's real name + designation. */
  roleLabel: string;
  nav: string[];
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // By the time this mounts, LoginGate has already confirmed a real login
  // happened and stored the resulting session — see auth/LoginGate.tsx.
  const [employeeCode] = useState(() => getStoredAuth()?.employeeCode ?? '');
  const { instance } = useMsal();

  const { data: access, isLoading } = useAccessProfile(employeeCode);
  const { data: employee } = useEmployee(employeeCode);
  const roleLabel = employee ? `${employee.fullName} — ${employee.designation}` : employeeCode;

  function logout() {
    clearStoredAuth();
    setAccessTokenGetter(null);
    // Ends the Microsoft/Entra session too (not just this app's local
    // state) - otherwise MSAL would silently sign back in from its own
    // cache the moment LoginGate re-checks isAuthenticated.
    instance.logoutRedirect();
  }

  const value: SessionValue = {
    employeeCode,
    roleLabel,
    nav: access?.navKeys ?? FALLBACK_NAV,
    isAdmin: access?.isAdmin ?? false,
    isLoading,
    logout,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}