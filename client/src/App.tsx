import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Schedule } from './pages/Schedule';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthSuccess, AuthError } from './pages/AuthCallback';
import { BillingSuccess, BillingCancel } from './pages/BillingCallback';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    return <Navigate to="/welcome" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/billing/cancel" element={<BillingCancel />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
