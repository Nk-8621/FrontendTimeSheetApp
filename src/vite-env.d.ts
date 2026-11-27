/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AZURE_TENANT_ID?: string;
  readonly VITE_AZURE_REDIRECT_URI?: string;
  readonly VITE_API_BASE_URL?: string;
  /** Local dry-run test login (see auth/DevLoginGate.tsx). Only honoured by `npm run dev`. */
  readonly VITE_DEV_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
