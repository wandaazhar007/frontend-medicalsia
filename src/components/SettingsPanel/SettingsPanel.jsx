import { usePreferences } from '../../context/PreferencesContext';
import styles from './SettingsPanel.module.scss';

export default function SettingsPanel() {
  const { theme, toggleTheme, language, toggleLanguage } = usePreferences();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Pengaturan</div>

      <div className={styles.row}>
        <span className={styles.label}>Tema</span>
        <button
          type="button"
          className={styles.toggle}
          role="switch"
          aria-checked={theme === 'dark'}
          onClick={toggleTheme}
        >
          <span className={`${styles.toggleOption} ${theme === 'light' ? styles.toggleOptionActive : ''}`}>Light</span>
          <span className={`${styles.toggleOption} ${theme === 'dark' ? styles.toggleOptionActive : ''}`}>Dark</span>
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Bahasa</span>
        <button
          type="button"
          className={styles.toggle}
          role="switch"
          aria-checked={language === 'en'}
          onClick={toggleLanguage}
        >
          <span className={`${styles.toggleOption} ${language === 'id' ? styles.toggleOptionActive : ''}`}>IND</span>
          <span className={`${styles.toggleOption} ${language === 'en' ? styles.toggleOptionActive : ''}`}>ENG</span>
        </button>
      </div>
    </div>
  );
}
