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
import QueuePage from './pages/dashboard/queue/QueuePage';
import ConsultationPage from './pages/dashboard/consultation/ConsultationPage';
import CashierPage from './pages/dashboard/cashier/CashierPage';
import InvoicesList from './pages/dashboard/invoices/InvoicesList';
import InvoiceDetail from './pages/dashboard/invoices/InvoiceDetail';
import PharmacyPage from './pages/dashboard/pharmacy/PharmacyPage';
import MedicinesList from './pages/dashboard/medicines/MedicinesList';
import MedicineForm from './pages/dashboard/medicines/MedicineForm';
import MedicalProceduresPage from './pages/dashboard/medical-procedures/MedicalProceduresPage';
import UsersList from './pages/dashboard/users/UsersList';
import UserForm from './pages/dashboard/users/UserForm';
import ProfilePage from './pages/dashboard/profile/ProfilePage';
import AccessDenied from './pages/dashboard/access-denied/AccessDenied';

// Receptionist is scoped to front-desk operations only (Appointment, Queue,
// Patients, Doctor Schedules) — everything else uses this list to exclude them.
const NON_RECEPTIONIST_ROLES = ['owner', 'admin', 'doctor', 'pharmacy', 'cashier'];

// Doctor is scoped to Dashboard/Queue/Patients/Doctor Schedules — manual
// booking is a front-desk tool, and cashier/invoices/pharmacy are non-clinical
// operations, so doctor is excluded from both.
const NON_DOCTOR_ROLES = ['owner', 'admin', 'receptionist', 'pharmacy', 'cashier'];
const OPERATIONAL_ROLES = ['owner', 'admin', 'pharmacy', 'cashier'];

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

  if (!user || !roles.includes(user.role)) return <AccessDenied />;

  return children;
}

// Dashboard has no widgets for receptionist, so instead of showing an empty
// page (or an access-denied flash right after login), send them straight to
// the one section they actually use.
function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === 'receptionist') return <Navigate to="/dashboard/appointments" replace />;

  return <Dashboard />;
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
        <Route index element={<DashboardHome />} />
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />
        <Route
          path="appointments"
          element={(
            <RequireRole roles={NON_DOCTOR_ROLES}>
              <AppointmentsList />
            </RequireRole>
          )}
        />
        <Route path="queue" element={<QueuePage />} />
        <Route
          path="consultation/:id"
          element={(
            <RequireRole roles={NON_RECEPTIONIST_ROLES}>
              <ConsultationPage />
            </RequireRole>
          )}
        />
        <Route path="doctor-schedules" element={<DoctorSchedulesPage />} />
        <Route
          path="cashier"
          element={(
            <RequireRole roles={OPERATIONAL_ROLES}>
              <CashierPage />
            </RequireRole>
          )}
        />
        <Route
          path="invoices"
          element={(
            <RequireRole roles={OPERATIONAL_ROLES}>
              <InvoicesList />
            </RequireRole>
          )}
        />
        <Route
          path="invoices/:id"
          element={(
            <RequireRole roles={OPERATIONAL_ROLES}>
              <InvoiceDetail />
            </RequireRole>
          )}
        />
        <Route
          path="pharmacy"
          element={(
            <RequireRole roles={OPERATIONAL_ROLES}>
              <PharmacyPage />
            </RequireRole>
          )}
        />
        <Route
          path="medicines"
          element={(
            <RequireRole roles={['owner', 'admin', 'pharmacy']}>
              <MedicinesList />
            </RequireRole>
          )}
        />
        <Route
          path="medicines/:id/edit"
          element={(
            <RequireRole roles={['owner', 'admin', 'pharmacy']}>
              <MedicineForm />
            </RequireRole>
          )}
        />
        <Route
          path="medical-procedures"
          element={(
            <RequireRole roles={['owner', 'admin']}>
              <MedicalProceduresPage />
            </RequireRole>
          )}
        />
        <Route
          path="users"
          element={(
            <RequireRole roles={['owner', 'admin']}>
              <UsersList />
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
