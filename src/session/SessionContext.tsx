import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setDevEmployeeCode } from '../api/authBridge';
import { useAccessProfile } from '../hooks/api/useEmployees';
import type { RoleId } from '../types/meridian';

/**
 * Which demo identity is "logged in" right now — a dev-mode stand-in for
 * real Microsoft login. These four employee codes match the ones seeded
 * server-side for exactly this purpose (see the backend seed script's
 * DEMO_ROLE_EMPLOYEES). Once real Entra login is switched on, this whole
 * switcher goes away and EmployeeCode comes from the authenticated token
 * instead — see auth/LoginGate.tsx and api/authBridge.ts.
 *
 * Note there's no `nav` array here anymore — navigation access (RBAC) is
 * computed entirely server-side from each employee's real position in the
 * org hierarchy (see IAccessControlService), not from a fixed role. These
 * four labels are just a convenience for the "Viewing as" switcher UI.
 */
export const DEMO_IDENTITIES: { roleId: RoleId; employeeCode: string; roleLabel: string }[] = [
  { roleId: 'EMP', employeeCode: 'CBT1267', roleLabel: 'Consultant — logs time' },
  { roleId: 'LEAD', employeeCode: 'CBT1152', roleLabel: 'Reporting Lead / PM — Level 1' },
  { roleId: 'L2', employeeCode: 'CBT1000', roleLabel: 'Delivery Head — Level 2' },
  { roleId: 'ADMIN', employeeCode: 'CBT1268', roleLabel: 'System Administrator' },
];

const FALLBACK_NAV = ['notif']; // shown only while the access profile is still loading

interface SessionValue {
  roleId: RoleId;
  employeeCode: string;
  roleLabel: string;
  nav: string[];
  isAdmin: boolean;
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

  // RBAC: fetch the real, server-computed access profile for this employee.
  // This is the single source of truth for navigation — see
  // Meridian.Application.Services.AccessControlService for how it's derived.
  const { data: access } = useAccessProfile(identity.employeeCode);

  const value: SessionValue = {
    roleId,
    employeeCode: identity.employeeCode,
    roleLabel: identity.roleLabel,
    nav: access?.navKeys ?? FALLBACK_NAV,
    isAdmin: access?.isAdmin ?? false,
    setRoleId,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}