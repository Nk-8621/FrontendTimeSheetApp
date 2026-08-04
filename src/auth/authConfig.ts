import type { Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const redirectUri = (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) || window.location.origin;

/**
 * True once real Azure AD (Entra ID) values have been supplied via .env.
 * Until then, the app runs in "dev mode" — no Microsoft login required,
 * and the role switcher in the sidebar stands in for authentication.
 *
 * To go live: create an App Registration in the Entra admin center for
 * your Carbynetech tenant, then set VITE_AZURE_CLIENT_ID, VITE_AZURE_TENANT_ID,
 * and VITE_AZURE_REDIRECT_URI in .env (see .env.example).
 */
export function isAzureConfigured(): boolean {
  return Boolean(clientId && tenantId);
}

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? '',
    authority: tenantId ? `https://login.microsoftonline.com/${tenantId}` : undefined,
    redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

/** Minimal scope for MVP: just sign the person in and read their basic profile. */
export const loginRequest = {
  scopes: ['User.Read'],
};
