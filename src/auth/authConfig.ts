import type { Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const redirectUri = (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) || window.location.origin;

/**
 * True once real Azure AD (Entra ID) values have been supplied via .env.
 * Microsoft sign-in is the only way to log in - until these are set,
 * LoginGate shows a "not configured" screen rather than any login form.
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

/**
 * Scope for the app's own backend API - NOT a Microsoft Graph scope. This
 * matches Meridian.Api's `AzureAd:Audience` ("api://<ClientId>") and
 * requires "Expose an API" -> a scope named `access_as_user` to have been
 * added to this App Registration in the Entra admin center (with this
 * app also added as an authorized client application for that scope) -
 * a token for `User.Read` (Microsoft Graph) will NOT be accepted by the
 * backend, since its audience is this API, not Graph.
 */
export const loginRequest = {
  scopes: clientId ? [`api://${clientId}/access_as_user`] : [],
};
