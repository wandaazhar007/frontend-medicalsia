import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CircleChevronDown, LogOut, Settings, User, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import LogoIcon from '../../../components/LogoIcon/LogoIcon';
import Wordmark from '../../../components/LogoIcon/Wordmark';
import NotificationPanel from '../../../components/NotificationPanel/NotificationPanel';
import SettingsPanel from '../../../components/SettingsPanel/SettingsPanel';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import styles from './Topbar.module.scss';

export default function Topbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  function closeAllDropdowns() {
    setIsMenuOpen(false);
    setIsNotifOpen(false);
    setIsSettingsOpen(false);
  }

  function toggleNotif() {
    setIsSettingsOpen(false);
    setIsMenuOpen(false);
    setIsNotifOpen((open) => !open);
  }

  function toggleSettings() {
    setIsNotifOpen(false);
    setIsMenuOpen(false);
    setIsSettingsOpen((open) => !open);
  }

  async function confirmLogout() {
    setIsLogoutModalOpen(false);
    await logout();
  }

  return (
    <header className={styles.topbar}>
      <Link to="/dashboard" className={styles.brand}>
        <LogoIcon variant="light" size={29} />
        <span className={styles.wordmark}>
          <Wordmark variant="light" />
        </span>
      </Link>

      {/* Desktop/tablet-up: icons inline. Below the breakpoint these hide
          entirely in favor of the hamburger button and dropdown. */}
      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} title={t('navbar.notifications')} onClick={toggleNotif}>
          <Bell size={16} />
        </button>
        <Link to="/dashboard/profile" className={styles.iconButton} title={t('navbar.profile')} onClick={closeAllDropdowns}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" className={styles.avatarThumb} />
          ) : (
            <User size={16} />
          )}
        </Link>
        <button type="button" className={styles.iconButton} title={t('navbar.settings')} onClick={toggleSettings}>
          <Settings size={16} />
        </button>
        <button type="button" className={styles.iconButton} title={t('navbar.logout')} onClick={() => setIsLogoutModalOpen(true)}>
          <LogOut size={16} />
        </button>
      </div>

      <button
        type="button"
        className={styles.hamburgerButton}
        title={isMenuOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? <X size={18} /> : <CircleChevronDown size={18} />}
      </button>

      {isMenuOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.mobileMenu}>
            <button type="button" className={styles.mobileMenuItem} onClick={toggleNotif}>
              <Bell size={16} />
              {t('navbar.notifications')}
            </button>
            <Link to="/dashboard/profile" className={styles.mobileMenuItem} onClick={closeAllDropdowns}>
              <User size={16} />
              {t('navbar.profile')}
            </Link>
            <button type="button" className={styles.mobileMenuItem} onClick={toggleSettings}>
              <Settings size={16} />
              {t('navbar.settings')}
            </button>
            <button
              type="button"
              className={styles.mobileMenuItem}
              onClick={() => {
                setIsMenuOpen(false);
                setIsLogoutModalOpen(true);
              }}
            >
              <LogOut size={16} />
              {t('navbar.logout')}
            </button>
          </div>
        </>
      )}

      {isNotifOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsNotifOpen(false)} />
          <div className={styles.dropdown}>
            <NotificationPanel />
          </div>
        </>
      )}

      {isSettingsOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsSettingsOpen(false)} />
          <div className={styles.dropdown}>
            <SettingsPanel />
          </div>
        </>
      )}

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title={t('navbar.logoutConfirmTitle')}>
        <p className={styles.modalText}>{t('navbar.logoutConfirmText')}</p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setIsLogoutModalOpen(false)}>
            <X size={14} />
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="danger" onClick={confirmLogout}>
            <LogOut size={14} />
            {t('navbar.logout')}
          </Button>
        </div>
      </Modal>
    </header>
  );
}
