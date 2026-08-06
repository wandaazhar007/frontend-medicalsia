import { NavLink } from 'react-router-dom';
import { CalendarClock, CalendarPlus, Clock, CreditCard, LayoutDashboard, Pill, Receipt, UserCog, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import styles from './Sidebar.module.scss';

function navLinkClass({ isActive }) {
  return `${styles.navItem} ${isActive ? styles.active : ''}`;
}

// Grouped per 06-design-system.md (Menu Utama / Operasional / Lainnya).
// Laporan hasn't landed yet (not in any phase so far). "Pengaturan" lives in
// the topbar instead of a "Lainnya" group, per product decision.
// "Jadwal Dokter" isn't named in the design doc's groups but is foundational
// setup (booking can't work without it), so it rides along in Menu Utama.
export default function Sidebar() {
  const { user } = useAuth();
  const canManageUsers = user && ['owner', 'admin'].includes(user.role);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.group}>
        <span className={styles.groupLabel}>Menu Utama</span>
        <NavLink to="/dashboard" end className={navLinkClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/appointments" className={navLinkClass}>
          <CalendarPlus size={18} />
          Appointment
        </NavLink>
        <NavLink to="/dashboard/queue" className={navLinkClass}>
          <Clock size={18} />
          Antrian
        </NavLink>
        <NavLink to="/dashboard/patients" className={navLinkClass}>
          <Users size={18} />
          Pasien
        </NavLink>
        <NavLink to="/dashboard/doctor-schedules" className={navLinkClass}>
          <CalendarClock size={18} />
          Jadwal Dokter
        </NavLink>
      </nav>

      <nav className={styles.group}>
        <span className={styles.groupLabel}>Operasional</span>
        <NavLink to="/dashboard/cashier" className={navLinkClass}>
          <CreditCard size={18} />
          Kasir
        </NavLink>
        <NavLink to="/dashboard/invoices" className={navLinkClass}>
          <Receipt size={18} />
          Invoice
        </NavLink>
        <NavLink to="/dashboard/pharmacy" className={navLinkClass}>
          <Pill size={18} />
          Farmasi
        </NavLink>
      </nav>

      {canManageUsers && (
        <nav className={styles.group}>
          <span className={styles.groupLabel}>Lainnya</span>
          <NavLink to="/dashboard/users" className={navLinkClass}>
            <UserCog size={18} />
            User
          </NavLink>
        </nav>
      )}
    </aside>
  );
}
