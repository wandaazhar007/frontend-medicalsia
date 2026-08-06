import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import ConnectionStatus from './components/ConnectionStatus/ConnectionStatus';
import Login from './pages/Login/Login';
import Booking from './pages/booking/Booking';
import Display from './pages/display/Display';
import DisplayPharmacy from './pages/display-pharmacy/DisplayPharmacy';
import DashboardLayout from './pages/dashboard/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import PatientsList from './pages/dashboard/patients/PatientsList';
import PatientForm from './pages/dashboard/patients/PatientForm';
import PatientDetail from './pages/dashboard/patients/PatientDetail';
import DoctorSchedulesPage from './pages/dashboard/doctor-schedules/DoctorSchedulesPage';
import AppointmentsList from './pages/dashboard/appointments/AppointmentsList';
import AppointmentForm from './pages/dashboard/appointments/AppointmentForm';
import QueuePage from './pages/dashboard/queue/QueuePage';
import ConsultationPage from './pages/dashboard/consultation/ConsultationPage';
import CashierPage from './pages/dashboard/cashier/CashierPage';
import InvoicesList from './pages/dashboard/invoices/InvoicesList';
import InvoiceDetail from './pages/dashboard/invoices/InvoiceDetail';
import PharmacyPage from './pages/dashboard/pharmacy/PharmacyPage';
import UsersList from './pages/dashboard/users/UsersList';
import UserForm from './pages/dashboard/users/UserForm';
import ProfilePage from './pages/dashboard/profile/ProfilePage';

// /pages/dashboard/* requires an authenticated session; /pages/booking,
// /pages/display, and /pages/display-pharmacy must never be wrapped in this guard.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// Backend already enforces this per-endpoint (requireRole) — this just
// avoids showing a broken staff-management page to roles that can't use it.
function RequireRole({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/display" element={<Display />} />
      <Route path="/display-pharmacy" element={<DisplayPharmacy />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        )}
      >
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />
        <Route path="appointments" element={<AppointmentsList />} />
        <Route path="appointments/new" element={<AppointmentForm />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="consultation/:id" element={<ConsultationPage />} />
        <Route path="doctor-schedules" element={<DoctorSchedulesPage />} />
        <Route path="cashier" element={<CashierPage />} />
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="pharmacy" element={<PharmacyPage />} />
        <Route
          path="users"
          element={(
            <RequireRole roles={['owner', 'admin']}>
              <UsersList />
            </RequireRole>
          )}
        />
        <Route
          path="users/new"
          element={(
            <RequireRole roles={['owner', 'admin']}>
              <UserForm />
            </RequireRole>
          )}
        />
        <Route
          path="users/:id/edit"
          element={(
            <RequireRole roles={['owner', 'admin']}>
              <UserForm />
            </RequireRole>
          )}
        />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <ConnectionStatus>
          <AppRoutes />
        </ConnectionStatus>
      </PreferencesProvider>
    </AuthProvider>
  );
}
