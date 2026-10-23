import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { SessionProvider } from './session/SessionContext';
import { HomeRoute, ProtectedRoute } from './session/ProtectedRoute';
import { UIProvider } from './components/ui/UIProvider';
import { MsalRoot } from './auth/MsalRoot';
import { LoginGate } from './auth/LoginGate';
import { lazy, Suspense } from 'react';
import { MyTimesheetPage } from './pages/MyTimesheetPage';

// Every other screen is downloaded only the first time someone opens it,
// instead of all screens in one big file up front - My Timesheet (the
// landing page) stays in the main file so the first screen isn't delayed.
// React.lazy needs a default export, hence the small .then() per page.
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage').then((m) => ({ default: m.MyTimesheetsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })));
const RequestsPage = lazy(() => import('./pages/RequestsPage').then((m) => ({ default: m.RequestsPage })));
const RequestApprovalPage = lazy(() => import('./pages/RequestApprovalPage').then((m) => ({ default: m.RequestApprovalPage })));
const MasterDataPage = lazy(() => import('./pages/MasterDataPage').then((m) => ({ default: m.MasterDataPage })));
const TeamCompliancePage = lazy(() => import('./pages/TeamCompliancePage').then((m) => ({ default: m.TeamCompliancePage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <MsalRoot>
      <LoginGate>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <UIProvider>
              <BrowserRouter>
                {/* Shown for the moment a screen's file is being downloaded. */}
                <Suspense fallback={<div className="page-content">Loading…</div>}>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<HomeRoute><MyTimesheetPage /></HomeRoute>} />

                    <Route
                      path="hist"
                      element={
                        <ProtectedRoute navKey="hist">
                          <MyTimesheetsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="req"
                      element={
                        <ProtectedRoute navKey="req">
                          <RequestsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="ap1"
                      element={
                        <ProtectedRoute navKey="ap1">
                          <ApprovalsPage level2={false} title="Level 1 Approvals" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="reqap"
                      element={
                        <ProtectedRoute navKey="reqap">
                          <RequestApprovalPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="ap2"
                      element={
                        <ProtectedRoute navKey="ap2">
                          <ApprovalsPage level2={true} title="Level 2 Approvals" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="team"
                      element={
                        <ProtectedRoute navKey="team">
                          <TeamCompliancePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="rep"
                      element={
                        <ProtectedRoute navKey="rep">
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="mast"
                      element={
                        <ProtectedRoute navKey="mast">
                          <MasterDataPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="notif"
                      element={
                        <ProtectedRoute navKey="notif">
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>
                </Routes>
                </Suspense>
              </BrowserRouter>
            </UIProvider>
          </SessionProvider>
        </QueryClientProvider>
      </LoginGate>
    </MsalRoot>
  );
}

export default App;
