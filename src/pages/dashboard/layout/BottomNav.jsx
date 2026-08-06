import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarClock, CalendarPlus, Clock, CreditCard, LayoutDashboard, Menu, Pill, Receipt, UserCog, Users, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import styles from './BottomNav.module.scss';

function navLinkClass({ isActive }) {
  return `${styles.navItem} ${isActive ? styles.active : ''}`;
}

// Mobile/tablet replacement for Sidebar, per 06-design-system.md: "Beranda,
// Antrian, Pasien, Menu". "Menu" opens a small sheet for the items that
// don't fit the 4-slot bar (Appointment, Jadwal Dokter) — separate from the
// unrelated account menu in Topbar (notifications/profile/settings/logout).
export default function BottomNav() {
  const { user } = useAuth();
  const canManageUsers = user && ['owner', 'admin'].includes(user.role);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <nav className={styles.bottomNav}>
      {isMoreOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsMoreOpen(false)} />
          <div className={styles.moreSheet}>
            <NavLink to="/dashboard/appointments" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              <CalendarPlus size={18} />
              Appointment
            </NavLink>
            <NavLink to="/dashboard/doctor-schedules" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              <CalendarClock size={18} />
              Jadwal Dokter
            </NavLink>
            <NavLink to="/dashboard/cashier" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              <CreditCard size={18} />
              Kasir
            </NavLink>
            <NavLink to="/dashboard/invoices" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              <Receipt size={18} />
              Invoice
            </NavLink>
            <NavLink to="/dashboard/pharmacy" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
              <Pill size={18} />
              Farmasi
            </NavLink>
            {canManageUsers && (
              <NavLink to="/dashboard/users" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <UserCog size={18} />
                User
              </NavLink>
            )}
          </div>
        </>
      )}

      <NavLink to="/dashboard" end className={navLinkClass}>
        <LayoutDashboard size={20} />
        Beranda
      </NavLink>
      <NavLink to="/dashboard/queue" className={navLinkClass}>
        <Clock size={20} />
        Antrian
      </NavLink>
      <NavLink to="/dashboard/patients" className={navLinkClass}>
        <Users size={20} />
        Pasien
      </NavLink>
      <button type="button" className={styles.navItem} onClick={() => setIsMoreOpen((open) => !open)}>
        {isMoreOpen ? <X size={20} /> : <Menu size={20} />}
        Menu
      </button>
    </nav>
  );
}
