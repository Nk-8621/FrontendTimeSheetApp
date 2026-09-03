import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { SessionProvider } from './session/SessionContext';
import { ProtectedRoute } from './session/ProtectedRoute';
import { UIProvider } from './components/ui/UIProvider';
import { MsalRoot } from './auth/MsalRoot';
import { LoginGate } from './auth/LoginGate';
import { MyTimesheetPage } from './pages/MyTimesheetPage';
import { MyTimesheetsPage } from './pages/MyTimesheetsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { RequestsPage } from './pages/RequestsPage';
import { RequestApprovalPage } from './pages/RequestApprovalPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { TeamCompliancePage } from './pages/TeamCompliancePage';
import { ReportsPage } from './pages/ReportsPage';

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
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<MyTimesheetPage />} />

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
              </BrowserRouter>
            </UIProvider>
          </SessionProvider>
        </QueryClientProvider>
      </LoginGate>
    </MsalRoot>
  );
}

export default App;