import { useMemo, type ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { isAzureConfigured, msalConfig } from './authConfig';

export function MsalRoot({ children }: { children: ReactNode }) {
  const configured = isAzureConfigured();

  // Only construct a PublicClientApplication when we actually have real
  // Azure values — constructing it with an empty clientId throws.
  const msalInstance = useMemo(() => (configured ? new PublicClientApplication(msalConfig) : null), [configured]);

  if (!configured || !msalInstance) {
    return <>{children}</>;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
