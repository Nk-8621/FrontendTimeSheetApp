# Meridian — Timesheet MVP (Frontend)

React + TypeScript + Vite frontend for Carbynetech's Meridian timesheet MVP.
**Now wired to the real .NET backend** (`src/Meridian.Api`) instead of
in-memory mock data.

## Getting started

1. **Start the backend first** (see the backend README) — it must be
   running for this to load any data.
2. Set `VITE_API_BASE_URL` in `.env` to match the backend's actual port
   (copy `.env.example` to `.env` and adjust):
   ```bash
   cp .env.example .env
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Use the **"Viewing as"** dropdown in the sidebar to switch between the
   four demo identities (these are real employees seeded in the database —
   Durga Prasad Malathumkar, Hamsini Narayana Murthy, Srinivas Karri, Nanda
   kishore Shivvani). Switching sends a different `X-Dev-Employee-Code`
   header to the backend, which is running in dev-mode auth right now.

## Screens

| Screen | Status |
|---|---|
| My Timesheet | ✅ Built, wired to the real API |
| Level 1 Approvals | ✅ Built — approve/return queue for direct reports |
| Level 2 Approvals | ✅ Built — approve/return queue for skip-level reports |
| Master Data | ✅ Built — read-only browser of departments/locations/accounts/projects |
| My Timesheets (history) | Placeholder — needs a new backend endpoint |
| Team Compliance | Placeholder — needs a new backend endpoint |
| Reports | Placeholder — needs a new backend endpoint |
| Notifications | Placeholder — needs a new backend endpoint |

## Bug fixes in this pass

- **Route guarding**: hiding a sidebar link for a role didn't actually block
  navigating to that URL directly. Every route is now wrapped in
  `<ProtectedRoute navKey="...">` (see `session/ProtectedRoute.tsx`), which
  redirects home if the current role isn't allowed there.
- **Stale data across identity switches**: `AppLayout` now remounts
  everything under it (`key={employeeCode}`) whenever the viewing identity
  changes, so no page can carry over a previous identity's state.

## What changed from the mock-data version

| Before | Now |
|---|---|
| `store/MeridianStore.tsx` — in-memory reducer holding all data | Removed. Server state is owned by **TanStack Query** (`src/hooks/api/`) |
| `data/meridianData.ts` / `data/seedEntries.ts` — static arrays | Removed. All org/project/timesheet data now comes from the API |
| Client-side submit validation (`TimesheetValidator` duplicated in the frontend) | Removed. `SubmitDrawer` now calls the backend's `/api/approvals/validate/...` endpoint — one source of truth for validation rules |
| `types/meridian.ts` held both data shapes and UI labels | Split: **`api/types.ts`** now holds the data shapes (mirroring the backend's DTOs field-for-field), **`types/meridian.ts`** keeps only UI-only display config (nav labels, day-type CSS classes) |

## Project structure (additions)

```
src/
  api/
    httpClient.ts     Base fetch wrapper: auth headers, JSON, error parsing
    authBridge.ts      Small bridge letting the (non-React) API client read
                        "who's currently logged in" without needing Context
    types.ts           TypeScript types mirroring the backend's DTOs exactly
    employees.ts, masterData.ts, timesheet.ts, approvals.ts
                        One file per backend controller, thin wrapper functions
  hooks/api/
    useEmployees.ts, useMasterData.ts, useMasterDataLookup.ts,
    useTimesheet.ts, useApprovals.ts
                        TanStack Query hooks — caching, loading/error states,
                        and mutations with automatic cache invalidation
  session/
    SessionContext.tsx  Replaces the old store's role-switching logic —
                        holds "which demo identity" and feeds it to authBridge
```

## Auth modes

Same dev-mode/real-Entra split as before (see `auth/` and `.env.example`)
— nothing changed there. What's new: once a request needs auth, `httpClient`
prefers a real MSAL bearer token (via `authBridge.setAccessTokenGetter`,
not yet wired up) over the dev-mode header, so switching on real Microsoft
login later is a small, contained change rather than a rewrite.

## One behavior change worth knowing about

The old mock demo allowed cycling a day through Working → WFH → **Leave**,
clearing hours client-side. The **real backend only allows W/WFH** through
the day-type endpoint — Leave and Holiday are meant to come from KEKA sync
and the holiday calendar respectively, not be set by hand. This is more
correct than the old placeholder behavior, but it does mean you can no
longer manually mark a day as Leave in the UI. That's expected until KEKA
sync exists.

## Not built yet

History, Team Compliance, Reports, and Notifications are still placeholder
screens — each needs a new backend endpoint (aggregate queries the current
controllers don't provide) before they can be built properly.
