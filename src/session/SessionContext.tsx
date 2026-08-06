import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setDevEmployeeCode, getStoredEmployeeCode, clearStoredEmployeeCode } from '../api/authBridge';
import { useAccessProfile, useEmployee } from '../hooks/api/useEmployees';

const FALLBACK_NAV = ['notif']; // shown only while the access profile is still loading

interface SessionValue {
  employeeCode: string;
  /** The current employee's real name + designation. */
  roleLabel: string;
  nav: string[];
  isAdmin: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // By the time this mounts, LoginGate has already confirmed a real login
  // happened and stored the resulting employee code — see auth/LoginGate.tsx.
  const [employeeCode] = useState(() => getStoredEmployeeCode() ?? '');

  useEffect(() => {
    setDevEmployeeCode(employeeCode);
    return () => setDevEmployeeCode(null);
  }, [employeeCode]);

  const { data: access } = useAccessProfile(employeeCode);
  const { data: employee } = useEmployee(employeeCode);
  const roleLabel = employee ? `${employee.fullName} — ${employee.designation}` : employeeCode;

  function logout() {
    clearStoredEmployeeCode();
    setDevEmployeeCode(null);
    window.location.reload(); // simplest reliable way back to LoginGate's login screen
  }

  const value: SessionValue = {
    employeeCode,
    roleLabel,
    nav: access?.navKeys ?? FALLBACK_NAV,
    isAdmin: access?.isAdmin ?? false,
    logout,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}