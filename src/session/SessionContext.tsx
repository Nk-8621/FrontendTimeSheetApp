import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setDevEmployeeCode } from '../api/authBridge';
import type { RoleId } from '../types/meridian';

/**
 * Which demo identity is "logged in" right now — a dev-mode stand-in for
 * real Microsoft login. These four employee codes match the ones seeded
 * server-side for exactly this purpose (see the backend seed script's
 * DEMO_ROLE_EMPLOYEES). Once real Entra login is switched on, this whole
 * switcher goes away and EmployeeCode comes from the authenticated token
 * instead — see auth/LoginGate.tsx and api/authBridge.ts.
 */
export const DEMO_IDENTITIES: { roleId: RoleId; employeeCode: string; roleLabel: string; nav: string[] }[] = [
  { roleId: 'EMP', employeeCode: 'CBT1267', roleLabel: 'Consultant — logs time', nav: ['ts', 'hist', 'notif'] },
  { roleId: 'LEAD', employeeCode: 'CBT1152', roleLabel: 'Reporting Lead / PM — Level 1', nav: ['ts', 'hist', 'ap1', 'team', 'rep', 'notif'] },
  { roleId: 'L2', employeeCode: 'CBT1000', roleLabel: 'Delivery Head — Level 2', nav: ['ap2', 'team', 'rep', 'notif'] },
  { roleId: 'ADMIN', employeeCode: 'CBT1268', roleLabel: 'System Administrator', nav: ['mast', 'team', 'rep', 'notif'] },
];

interface SessionValue {
  roleId: RoleId;
  employeeCode: string;
  roleLabel: string;
  nav: string[];
  setRoleId: (roleId: RoleId) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<RoleId>('EMP');
  const identity = useMemo(() => DEMO_IDENTITIES.find((i) => i.roleId === roleId) ?? DEMO_IDENTITIES[0], [roleId]);

  // Whenever the selected identity changes, tell the API client which
  // employee code to send as the dev-mode auth header.
  useEffect(() => {
    setDevEmployeeCode(identity.employeeCode);
    return () => setDevEmployeeCode(null);
  }, [identity.employeeCode]);

  const value: SessionValue = {
    roleId,
    employeeCode: identity.employeeCode,
    roleLabel: identity.roleLabel,
    nav: identity.nav,
    setRoleId,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
