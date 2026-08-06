import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CircleChevronDown, LogOut, Settings, User, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import LogoIcon from '../../../components/LogoIcon/LogoIcon';
import Wordmark from '../../../components/LogoIcon/Wordmark';
import styles from './Topbar.module.scss';

// Notification/profile/settings have no destination page yet (later phases) —
// they're rendered now so the chrome matches the final layout, but only
// Logout is wired up.
const MENU_ITEMS = [
  { key: 'notifications', label: 'Notifikasi (segera hadir)', icon: Bell },
  { key: 'profile', label: 'Profil (segera hadir)', icon: User },
  { key: 'settings', label: 'Pengaturan (segera hadir)', icon: Settings },
];

export default function Topbar() {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <Link to="/dashboard" className={styles.brand}>
        <LogoIcon variant="light" size={32} />
        <span className={styles.wordmark}>
          <Wordmark variant="light" />
        </span>
      </Link>

      {/* Desktop/tablet-up: icons inline. Below the breakpoint these hide
          entirely in favor of the hamburger button and dropdown. */}
      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} title="Notifikasi (segera hadir)">
          <Bell size={18} />
        </button>
        <button type="button" className={styles.iconButton} title="Profil (segera hadir)">
          <User size={18} />
        </button>
        <button type="button" className={styles.iconButton} title="Pengaturan (segera hadir)">
          <Settings size={18} />
        </button>
        <button type="button" className={styles.iconButton} title="Keluar" onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>

      <button
        type="button"
        className={styles.hamburgerButton}
        title={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? <X size={20} /> : <CircleChevronDown size={20} />}
      </button>

      {isMenuOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.mobileMenu}>
            {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" className={styles.mobileMenuItem}>
                <Icon size={18} />
                {label}
              </button>
            ))}
            <button
              type="button"
              className={styles.mobileMenuItem}
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </>
      )}
    </header>
  );
}
