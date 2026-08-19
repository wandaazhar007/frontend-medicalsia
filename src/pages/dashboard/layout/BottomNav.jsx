import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, CalendarPlus, Clock, CreditCard, LayoutDashboard, Menu, Monitor, Pill, PillBottle, Receipt, Syringe, Tv, UserCog, Users, X } from 'lucide-react';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageUsers = user && ['owner', 'admin'].includes(user.role);
  const canManageMedicines = user && ['owner', 'admin', 'pharmacy'].includes(user.role);
  const isReceptionist = user?.role === 'receptionist';
  const isDoctor = user?.role === 'doctor';
  const isCashier = user?.role === 'cashier';
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <nav className={styles.bottomNav}>
      {isMoreOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsMoreOpen(false)} />
          <div className={styles.moreSheet}>
            {!isReceptionist && !isDoctor && !isCashier && (
              <NavLink to="/dashboard/appointments" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <CalendarPlus size={16} />
                {t('sidebar.appointment')}
              </NavLink>
            )}
            {!isCashier && (
              <NavLink to="/dashboard/doctor-schedules" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <CalendarClock size={16} />
                {t('sidebar.doctorSchedules')}
              </NavLink>
            )}
            {!isReceptionist && !isDoctor && !isCashier && (
              <NavLink to="/dashboard/cashier" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <CreditCard size={16} />
                {t('sidebar.cashier')}
              </NavLink>
            )}
            {!isReceptionist && !isDoctor && (
              <NavLink to="/dashboard/invoices" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <Receipt size={16} />
                {t('sidebar.invoices')}
              </NavLink>
            )}
            {!isReceptionist && !isDoctor && !isCashier && (
              <NavLink to="/dashboard/pharmacy" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <Pill size={16} />
                {t('sidebar.pharmacy')}
              </NavLink>
            )}
            {canManageMedicines && (
              <NavLink to="/dashboard/medicines" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <PillBottle size={16} />
                {t('sidebar.medicines')}
              </NavLink>
            )}
            {canManageUsers && (
              <NavLink to="/dashboard/medical-procedures" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <Syringe size={16} />
                {t('sidebar.medicalProcedures')}
              </NavLink>
            )}
            {canManageUsers && (
              <NavLink to="/dashboard/users" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <UserCog size={16} />
                {t('sidebar.users')}
              </NavLink>
            )}
            {isReceptionist && (
              <a href="/display" target="_blank" rel="noopener noreferrer" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <Monitor size={16} />
                {t('sidebar.displayQueue')}
              </a>
            )}
            {isReceptionist && (
              <a href="/display-pharmacy" target="_blank" rel="noopener noreferrer" className={styles.moreItem} onClick={() => setIsMoreOpen(false)}>
                <Tv size={16} />
                {t('sidebar.displayPharmacyQueue')}
              </a>
            )}
          </div>
        </>
      )}

      {isReceptionist ? (
        <NavLink to="/dashboard/appointments" className={navLinkClass}>
          <CalendarPlus size={18} />
          {t('sidebar.appointment')}
        </NavLink>
      ) : (
        <NavLink to="/dashboard" end className={navLinkClass}>
          <LayoutDashboard size={18} />
          {t('sidebar.home')}
        </NavLink>
      )}
      {isCashier ? (
        <NavLink to="/dashboard/cashier" className={navLinkClass}>
          <CreditCard size={18} />
          {t('sidebar.cashier')}
        </NavLink>
      ) : (
        <NavLink to="/dashboard/queue" className={navLinkClass}>
          <Clock size={18} />
          {t('sidebar.queue')}
        </NavLink>
      )}
      <NavLink to="/dashboard/patients" className={navLinkClass}>
        <Users size={18} />
        {t('sidebar.patients')}
      </NavLink>
      <button type="button" className={styles.navItem} onClick={() => setIsMoreOpen((open) => !open)}>
        {isMoreOpen ? <X size={18} /> : <Menu size={18} />}
        {t('sidebar.menu')}
      </button>
    </nav>
  );
}
