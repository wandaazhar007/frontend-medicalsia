import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, CalendarPlus, Clock, CreditCard, LayoutDashboard, Loader2, Monitor, Pill, PillBottle, Receipt, Syringe, Tv, UserCog, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import styles from './Sidebar.module.scss';

function navLinkClass({ isActive }) {
  return `${styles.navItem} ${isActive ? styles.active : ''}`;
}

// Don't flash the spinner for a barely-perceptible instant on fast/cached
// navigations, but don't let it spin forever either if a page turns out to
// have nothing to fetch (no medicalsia:api-loading-end will ever fire).
const MIN_VISIBLE_MS = 250;
const FALLBACK_MS = 3000;

// Swaps its icon for a spinner while `to` is the in-flight navigation target.
// Spinner duration tracks real API activity (via the api.js request-loading
// events), not a guessed timeout — it clears as soon as the destination
// page's own fetch (the one behind its skeleton loading state) resolves.
function SidebarNavLink({ to, end, icon: Icon, label, loadingPath, onNavigate }) {
  const isLoading = loadingPath === to;

  return (
    <NavLink to={to} end={end} className={navLinkClass} onClick={() => onNavigate(to)}>
      {isLoading ? <Loader2 size={16} className={styles.spin} /> : <Icon size={16} />}
      {label}
    </NavLink>
  );
}

// Grouped per 06-design-system.md (Menu Utama / Operasional / Lainnya).
// Laporan hasn't landed yet (not in any phase so far). "Pengaturan" lives in
// the topbar instead of a "Lainnya" group, per product decision.
// "Jadwal Dokter" isn't named in the design doc's groups but is foundational
// setup (booking can't work without it), so it rides along in Menu Utama.
export default function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const canManageUsers = user && ['owner', 'admin'].includes(user.role);
  const canManageMedicines = user && ['owner', 'admin', 'pharmacy'].includes(user.role);
  const isReceptionist = user?.role === 'receptionist';
  const isDoctor = user?.role === 'doctor';
  const isCashier = user?.role === 'cashier';
  const isPharmacy = user?.role === 'pharmacy';

  const [loadingPath, setLoadingPath] = useState(null);
  const loadingPathRef = useRef(null);
  const loadingSinceRef = useRef(0);
  const fallbackTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  function setLoading(path) {
    loadingPathRef.current = path;
    setLoadingPath(path);
  }

  function handleNavigate(path) {
    if (path === location.pathname) return; // already there — nothing will actually load
    clearTimeout(fallbackTimerRef.current);
    clearTimeout(clearTimerRef.current);
    loadingSinceRef.current = Date.now();
    setLoading(path);
    fallbackTimerRef.current = setTimeout(() => setLoading(null), FALLBACK_MS);
  }

  useEffect(() => {
    function handleLoadingEnd() {
      if (!loadingPathRef.current) return;
      clearTimeout(fallbackTimerRef.current);
      const elapsed = Date.now() - loadingSinceRef.current;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setLoading(null), remaining);
    }

    window.addEventListener('medicalsia:api-loading-end', handleLoadingEnd);
    return () => {
      window.removeEventListener('medicalsia:api-loading-end', handleLoadingEnd);
      clearTimeout(fallbackTimerRef.current);
      clearTimeout(clearTimerRef.current);
    };
  }, []);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.group}>
        <span className={styles.groupLabel}>{t('sidebar.groupMain')}</span>
        {!isReceptionist && (
          <SidebarNavLink to="/dashboard" end icon={LayoutDashboard} label={t('sidebar.dashboard')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        )}
        {!isDoctor && !isCashier && !isPharmacy && (
          <SidebarNavLink to="/dashboard/appointments" icon={CalendarPlus} label={t('sidebar.appointment')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        )}
        {!isCashier && !isPharmacy && (
          <SidebarNavLink to="/dashboard/queue" icon={Clock} label={t('sidebar.queue')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        )}
        {!isPharmacy && (
          <SidebarNavLink to="/dashboard/patients" icon={Users} label={t('sidebar.patients')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        )}
        {!isCashier && !isPharmacy && (
          <SidebarNavLink to="/dashboard/doctor-schedules" icon={CalendarClock} label={t('sidebar.doctorSchedules')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        )}
      </nav>

      {!isReceptionist && !isDoctor && (
        <nav className={styles.group}>
          <span className={styles.groupLabel}>{t('sidebar.groupOperations')}</span>
          {!isPharmacy && (
            <SidebarNavLink to="/dashboard/cashier" icon={CreditCard} label={t('sidebar.cashier')} loadingPath={loadingPath} onNavigate={handleNavigate} />
          )}
          {!isPharmacy && (
            <SidebarNavLink to="/dashboard/invoices" icon={Receipt} label={t('sidebar.invoices')} loadingPath={loadingPath} onNavigate={handleNavigate} />
          )}
          {!isCashier && (
            <SidebarNavLink to="/dashboard/pharmacy" icon={Pill} label={t('sidebar.pharmacy')} loadingPath={loadingPath} onNavigate={handleNavigate} />
          )}
          {canManageMedicines && (
            <SidebarNavLink to="/dashboard/medicines" icon={PillBottle} label={t('sidebar.medicines')} loadingPath={loadingPath} onNavigate={handleNavigate} />
          )}
          {canManageMedicines && (
            <SidebarNavLink to="/dashboard/medical-procedures" icon={Syringe} label={t('sidebar.medicalProcedures')} loadingPath={loadingPath} onNavigate={handleNavigate} />
          )}
        </nav>
      )}

      {canManageUsers && (
        <nav className={styles.group}>
          <span className={styles.groupLabel}>{t('sidebar.groupOther')}</span>
          <SidebarNavLink to="/dashboard/users" icon={UserCog} label={t('sidebar.users')} loadingPath={loadingPath} onNavigate={handleNavigate} />
        </nav>
      )}

      {(isReceptionist || isPharmacy) && (
        <nav className={styles.group}>
          <span className={styles.groupLabel}>{t('sidebar.groupOther')}</span>
          <a href="/display" target="_blank" rel="noopener noreferrer" className={styles.navItem}>
            <Monitor size={16} />
            {t('sidebar.displayQueue')}
          </a>
          <a href="/display-pharmacy" target="_blank" rel="noopener noreferrer" className={styles.navItem}>
            <Tv size={16} />
            {t('sidebar.displayPharmacyQueue')}
          </a>
        </nav>
      )}
    </aside>
  );
}
